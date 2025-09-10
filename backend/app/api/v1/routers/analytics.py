from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.models import Event, Item, User, Organization
from app.schemas.schemas import EventCreate, EventOut, AnalyticsSummary
from app.auth.auth import get_current_user_optional
from app.services.ai import ai_service


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/events", response_model=EventOut)
def log_event(
    payload: EventCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional),
):
    event = Event(
        user_id=current_user.id if current_user else None,
        item_id=payload.item_id,
        org_id=payload.org_id,
        event_type=payload.event_type,
        metadata_json=payload.metadata or {},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(db: Session = Depends(get_db)):
    total_items = db.query(func.count(Item.id)).scalar() or 0
    total_claimed = db.query(func.count(Item.id)).filter(Item.status == "claimed").scalar() or 0
    total_unclaimed = total_items - total_claimed
    claim_rate = (total_claimed / total_items) if total_items else 0.0

    donors = db.query(func.count(func.distinct(User.id))).filter(User.role == "donor").scalar() or 0
    recipients = db.query(func.count(func.distinct(User.id))).filter(User.role != "donor").scalar() or 0

    next_24h = datetime.utcnow() + timedelta(hours=24)
    items_expiring_next_24h = (
        db.query(func.count(Item.id))
        .filter(Item.expires_at.isnot(None))
        .filter(Item.expires_at <= next_24h)
        .scalar()
        or 0
    )

    return AnalyticsSummary(
        total_items=total_items,
        total_claimed=total_claimed,
        total_unclaimed=total_unclaimed,
        claim_rate=round(claim_rate, 4),
        donors=donors,
        recipients=recipients,
        items_expiring_next_24h=items_expiring_next_24h,
    )


@router.get("/series")
def analytics_series(
    days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Return daily time-series for items created and claimed over the past N days."""
    end = datetime.utcnow().date()
    start = end - timedelta(days=days - 1)

    # Build day buckets
    labels = []
    created_counts = []
    claimed_counts = []
    for i in range(days):
        day = start + timedelta(days=i)
        next_day = day + timedelta(days=1)
        labels.append(day.isoformat())
        created = (
            db.query(func.count(Item.id))
            .filter(Item.ready_at.isnot(None))
            .filter(Item.ready_at >= day)
            .filter(Item.ready_at < next_day)
            .scalar()
            or 0
        )
        claimed = (
            db.query(func.count(Item.id))
            .filter(Item.claimed_at.isnot(None))
            .filter(Item.claimed_at >= day)
            .filter(Item.claimed_at < next_day)
            .scalar()
            or 0
        )
        created_counts.append(created)
        claimed_counts.append(claimed)

    return {
        "labels": labels,
        "created": created_counts,
        "claimed": claimed_counts,
    }


@router.get("/categories")
def analytics_categories(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Return counts by category for items created and claimed in the last N days."""
    end = datetime.utcnow()
    start = end - timedelta(days=days)

    created_rows = (
        db.query(Item.category, func.count(Item.id))
        .filter(Item.ready_at.isnot(None))
        .filter(Item.ready_at >= start)
        .group_by(Item.category)
        .all()
    )

    claimed_rows = (
        db.query(Item.category, func.count(Item.id))
        .filter(Item.claimed_at.isnot(None))
        .filter(Item.claimed_at >= start)
        .group_by(Item.category)
        .all()
    )

    def normalize(rows):
        out = {}
        for cat, cnt in rows:
            key = cat or "Uncategorized"
            out[key] = int(cnt or 0)
        return out

    return {
        "created": normalize(created_rows),
        "claimed": normalize(claimed_rows),
    }


@router.get("/forecast")
def analytics_forecast(
    days: int = Query(14, ge=7, le=90),
    horizon: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    """Forecast created and claimed using simple linear regression on the past N days."""
    series = analytics_series(days=days, db=db)  # reuse computation
    x = list(range(days))

    def linreg_forecast(values: list[int]):
        n = len(values)
        if n == 0:
            return [0] * horizon
        mean_x = sum(x) / n
        mean_y = sum(values) / n
        denom = sum((xi - mean_x) ** 2 for xi in x) or 1
        slope = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, values)) / denom
        intercept = mean_y - slope * mean_x
        return [max(0, intercept + slope * (n + h)) for h in range(horizon)]

    created_fc = linreg_forecast(series["created"])  # type: ignore
    claimed_fc = linreg_forecast(series["claimed"])  # type: ignore

    end_date = datetime.utcnow().date()
    future_labels = [(end_date + timedelta(days=h + 1)).isoformat() for h in range(horizon)]

    return {
        "labels": future_labels,
        "created": [round(v, 2) for v in created_fc],
        "claimed": [round(v, 2) for v in claimed_fc],
    }


@router.get("/risk")
def analytics_risk(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)):
    """Return items most at risk of expiring unclaimed with a simple risk score."""
    now = datetime.utcnow()
    items = (
        db.query(Item)
        .filter(Item.status == "listed")
        .filter((Item.expires_at.is_(None)) | (Item.expires_at >= now))
        .all()
    )

    risky = []
    for it in items:
        if it.expires_at is None:
            hours_left = 9999.0
        else:
            delta = it.expires_at - now
            hours_left = max(0.0, delta.total_seconds() / 3600.0)
        quantity = float(it.quantity or 1.0)
        # Simple risk formula: time pressure + quantity factor
        risk = (1.0 / (1.0 + hours_left)) + 0.05 * quantity
        risky.append({
            "id": it.id,
            "title": it.title,
            "category": it.category or "Unknown",
            "org_id": it.org_id,
            "expires_at": it.expires_at.isoformat() if it.expires_at else None,
            "hours_left": round(hours_left, 2) if it.expires_at else None,
            "quantity": it.quantity,
            "risk_score": round(risk, 4),
        })

    risky.sort(key=lambda r: r["risk_score"], reverse=True)
    return {"items": risky[:limit]}


@router.get("/cohorts")
def analytics_cohorts(
    weeks: int = Query(12, ge=4, le=52),
    db: Session = Depends(get_db),
):
    """Weekly donor retention cohorts based on first donation week (ready_at).

    Returns labels (cohort weeks), offsets (0..k) and a matrix of retention
    rates (0..1) where value[i][j] = share of cohort i donors who donated in
    week j relative to their first donation week.
    """
    end = datetime.utcnow().date()
    start = end - timedelta(weeks=weeks)

    # Fetch donations in the range
    rows = (
        db.query(User.id.label("user_id"), Item.ready_at)
        .join(User, User.id == Item.donated_by_user_id)
        .filter(Item.donated_by_user_id.isnot(None))
        .filter(Item.ready_at.isnot(None))
        .filter(Item.ready_at >= start)
        .filter(Item.ready_at < end + timedelta(days=1))
        .all()
    )

    # Map donor -> sorted weeks they donated
    from collections import defaultdict
    donor_weeks: dict[int, list[int]] = defaultdict(list)
    for user_id, ready_at in rows:
        w = (ready_at.date() - start).days // 7
        donor_weeks[user_id].append(int(w))
    for u in list(donor_weeks.keys()):
        donor_weeks[u] = sorted(set(donor_weeks[u]))

    # Build cohorts by first week
    cohorts: dict[int, set[int]] = defaultdict(set)
    donations_by_week: dict[int, set[int]] = defaultdict(set)
    for user_id, weeks_list in donor_weeks.items():
        if not weeks_list:
            continue
        first_w = weeks_list[0]
        cohorts[first_w].add(user_id)
        for w in weeks_list:
            donations_by_week[w].add(user_id)

    cohort_weeks_sorted = sorted(cohorts.keys())
    labels = [(start + timedelta(weeks=w)).isoformat() for w in cohort_weeks_sorted]
    max_offset = min(12, weeks)  # limit grid width
    offsets = list(range(max_offset))

    matrix: list[list[float]] = []
    for cw in cohort_weeks_sorted:
        cohort_users = cohorts[cw]
        size = max(1, len(cohort_users))
        row = []
        for off in offsets:
            week_idx = cw + off
            active = donations_by_week.get(week_idx, set()) & cohort_users
            row.append(round(len(active) / size, 4))
        matrix.append(row)

    return {"labels": labels, "offsets": offsets, "matrix": matrix}


@router.get("/explain")
def analytics_explain(db: Session = Depends(get_db)):
    """Generate AI-powered insights from analytics data."""
    
    # Gather all analytics data
    summary_data = analytics_summary(db=db)
    time_series_data = analytics_series(days=14, db=db)
    categories_data = analytics_categories(days=30, db=db)
    risk_data = analytics_risk(db=db, limit=10)
    
    # Convert Pydantic models to dicts for AI service
    summary_dict = {
        "total_items": summary_data.total_items,
        "total_claimed": summary_data.total_claimed,
        "total_unclaimed": summary_data.total_unclaimed,
        "claim_rate": summary_data.claim_rate,
        "donors": summary_data.donors,
        "recipients": summary_data.recipients,
        "items_expiring_next_24h": summary_data.items_expiring_next_24h
    }
    
    # Generate insights using AI service
    insights = ai_service.generate_analytics_insights(
        summary_data=summary_dict,
        time_series_data=time_series_data,
        categories_data=categories_data,
        risk_data=risk_data
    )
    
    return {
        "insights": insights,
        "ai_powered": False,  # Using enhanced rule-based system
        "openai_available": bool(ai_service.is_available())
    }


@router.get("/explain/detailed")
def analytics_explain_detailed(db: Session = Depends(get_db)):
    """Generate detailed AI-powered insights using OpenAI (when quota available)."""
    
    if not ai_service.is_available():
        return {
            "insights": ["OpenAI detailed analysis requires API key and quota. Using enhanced rule-based analysis instead."],
            "ai_powered": False,
            "error": "OpenAI not available"
        }
    
    # Gather all analytics data
    summary_data = analytics_summary(db=db)
    time_series_data = analytics_series(days=14, db=db)
    categories_data = analytics_categories(days=30, db=db)
    risk_data = analytics_risk(db=db, limit=10)
    
    # Convert Pydantic models to dicts for AI service
    summary_dict = {
        "total_items": summary_data.total_items,
        "total_claimed": summary_data.total_claimed,
        "total_unclaimed": summary_data.total_unclaimed,
        "claim_rate": summary_data.claim_rate,
        "donors": summary_data.donors,
        "recipients": summary_data.recipients,
        "items_expiring_next_24h": summary_data.items_expiring_next_24h
    }
    
    try:
        # Force OpenAI call for detailed analysis
        context = ai_service._prepare_context(summary_dict, time_series_data, categories_data, risk_data)
        prompt = ai_service._create_analytics_prompt(context)
        
        response = ai_service.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert food waste reduction analyst providing detailed, actionable insights for FoodBridge. Provide strategic recommendations for platform optimization, community growth, and waste reduction impact."
                },
                {
                    "role": "user", 
                    "content": prompt + "\n\nProvide 6-8 detailed insights with specific recommendations and metrics."
                }
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        insights = ai_service._parse_ai_response(content)
        
        return {
            "insights": insights,
            "ai_powered": True,
            "model": "gpt-4o-mini",
            "note": "Detailed AI analysis - premium feature"
        }
        
    except Exception as e:
        return {
            "insights": ai_service._enhanced_rule_insights(summary_dict, time_series_data, categories_data, risk_data),
            "ai_powered": False,
            "error": f"OpenAI error: {str(e)[:100]}..."
        }


@router.get("/locations")
def analytics_locations(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)):
    """Get top locations by donation and claim activity."""
    
    # Top donation locations (by organization address)
    donation_locations = (
        db.query(
            Organization.address,
            Organization.lat,
            Organization.lng,
            func.count(Item.id).label('donation_count')
        )
        .join(Item, Item.org_id == Organization.id)
        .filter(Organization.address.isnot(None))
        .filter(Item.ready_at.isnot(None))
        .group_by(Organization.address, Organization.lat, Organization.lng)
        .order_by(func.count(Item.id).desc())
        .limit(limit)
        .all()
    )
    
    # Top claim locations (by claimed items)
    claim_locations = (
        db.query(
            Organization.address,
            Organization.lat, 
            Organization.lng,
            func.count(Item.id).label('claim_count')
        )
        .join(Item, Item.org_id == Organization.id)
        .filter(Organization.address.isnot(None))
        .filter(Item.claimed_at.isnot(None))
        .group_by(Organization.address, Organization.lat, Organization.lng)
        .order_by(func.count(Item.id).desc())
        .limit(limit)
        .all()
    )
    
    return {
        "top_donation_locations": [
            {
                "address": loc.address,
                "lat": loc.lat,
                "lng": loc.lng,
                "count": loc.donation_count
            }
            for loc in donation_locations
        ],
        "top_claim_locations": [
            {
                "address": loc.address,
                "lat": loc.lat,
                "lng": loc.lng,
                "count": loc.claim_count
            }
            for loc in claim_locations
        ]
    }


@router.get("/contributors")
def analytics_contributors(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)):
    """Get top donors and recipients by activity."""
    
    # Top donors (by items donated)
    top_donors = (
        db.query(
            User.name,
            User.email,
            func.count(Item.id).label('donations_count')
        )
        .join(Item, Item.donated_by_user_id == User.id)
        .group_by(User.id, User.name, User.email)
        .order_by(func.count(Item.id).desc())
        .limit(limit)
        .all()
    )
    
    # Top recipients (by items claimed)
    top_recipients = (
        db.query(
            User.name,
            User.email,
            func.count(Item.id).label('claims_count')
        )
        .join(Item, Item.claimed_by_user_id == User.id)
        .group_by(User.id, User.name, User.email)
        .order_by(func.count(Item.id).desc())
        .limit(limit)
        .all()
    )
    
    return {
        "top_donors": [
            {
                "name": donor.name,
                "email": donor.email[:3] + "***@" + donor.email.split("@")[1] if "@" in donor.email else donor.email,  # Privacy
                "donations": donor.donations_count
            }
            for donor in top_donors
        ],
        "top_recipients": [
            {
                "name": recipient.name,
                "email": recipient.email[:3] + "***@" + recipient.email.split("@")[1] if "@" in recipient.email else recipient.email,  # Privacy
                "claims": recipient.claims_count
            }
            for recipient in top_recipients
        ]
    }


@router.get("/predictions")
def analytics_predictions(db: Session = Depends(get_db)):
    """Generate ML-style predictions for location and timing patterns."""
    
    # Get location patterns for the last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # Hourly donation patterns
    hourly_donations = (
        db.query(
            func.extract('hour', Item.ready_at).label('hour'),
            func.count(Item.id).label('count')
        )
        .filter(Item.ready_at >= start_date)
        .group_by(func.extract('hour', Item.ready_at))
        .all()
    )
    
    # Daily patterns
    daily_donations = (
        db.query(
            func.extract('dow', Item.ready_at).label('day_of_week'),  # 0=Sunday, 6=Saturday
            func.count(Item.id).label('count')
        )
        .filter(Item.ready_at >= start_date)
        .group_by(func.extract('dow', Item.ready_at))
        .all()
    )
    
    # Simple prediction logic (in production, use actual ML models)
    hour_data = {int(h): c for h, c in hourly_donations}
    day_data = {int(d): c for d, c in daily_donations}
    
    # Predict next best hours (simple heuristic: top 3 hours)
    best_hours = sorted(hour_data.items(), key=lambda x: x[1], reverse=True)[:3]
    best_days = sorted(day_data.items(), key=lambda x: x[1], reverse=True)[:3]
    
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    
    return {
        "hourly_patterns": [{"hour": h, "count": hour_data.get(h, 0)} for h in range(24)],
        "daily_patterns": [{"day": day_names[d], "day_number": d, "count": day_data.get(d, 0)} for d in range(7)],
        "predictions": {
            "best_donation_hours": [{"hour": h, "count": c} for h, c in best_hours],
            "best_donation_days": [{"day": day_names[d], "count": c} for d, c in best_days],
            "next_peak_time": f"{best_hours[0][0]:02d}:00" if best_hours else "12:00"
        }
    }


