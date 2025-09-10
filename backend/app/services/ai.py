"""
AI Services for generating insights and analysis
"""
import json
from typing import Dict, List, Any, Optional
from openai import OpenAI
from app.core.config import get_settings

settings = get_settings()


class AIService:
    """Service for AI-powered analytics and insights"""
    
    def __init__(self):
        self.client = None
        print(f"Initializing AI Service...")
        print(f"OpenAI enabled: {settings.openai_enabled}")
        print(f"OpenAI API key set: {'Yes' if settings.openai_api_key else 'No'}")
        print(f"OpenAI API key length: {len(settings.openai_api_key) if settings.openai_api_key else 0}")
        
        if settings.openai_enabled and settings.openai_api_key:
            try:
                self.client = OpenAI(api_key=settings.openai_api_key)
                print("OpenAI client initialized successfully")
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")
        else:
            print("OpenAI not enabled or API key not set")
    
    def is_available(self) -> bool:
        """Check if AI service is available and configured"""
        available = self.client is not None and settings.openai_enabled and settings.openai_api_key
        print(f"AI service availability check: {available}")
        return available
    
    def generate_analytics_insights(
        self, 
        summary_data: Dict[str, Any],
        time_series_data: Dict[str, Any],
        categories_data: Dict[str, Any],
        risk_data: Dict[str, Any]
    ) -> List[str]:
        """
        Generate intelligent insights from analytics data using OpenAI
        
        Args:
            summary_data: Overall platform statistics
            time_series_data: 14-day trend data
            categories_data: Category breakdown data
            risk_data: High-risk items data
            
        Returns:
            List of insight strings
        """
        # Always use enhanced rule-based insights as the primary system
        enhanced_insights = self._enhanced_rule_insights(summary_data, time_series_data, categories_data, risk_data)
        
        # Optionally enhance with OpenAI for special detailed analysis
        if not self.is_available():
            return enhanced_insights
        
        # For now, return enhanced rule-based insights
        # OpenAI can be enabled for special reports or when quota is available
        return enhanced_insights
        
        # Commented out OpenAI call for hybrid approach
        # Uncomment when you want to use OpenAI for additional insights
        """
        try:
            print("Starting AI insight generation...")
            
            # Prepare context data for AI
            context = self._prepare_context(summary_data, time_series_data, categories_data, risk_data)
            print(f"Context prepared: {list(context.keys())}")
            
            # Create AI prompt
            prompt = self._create_analytics_prompt(context)
            print(f"Prompt created, length: {len(prompt)}")
            
            # Call OpenAI API
            print("Calling OpenAI API...")
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert food waste reduction analyst providing actionable insights for FoodBridge, a platform that connects food donors with recipients to reduce waste and fight hunger."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            print("OpenAI API call successful!")
            
            # Parse response into insights
            content = response.choices[0].message.content
            print(f"AI response: {content[:200]}...")
            insights = self._parse_ai_response(content)
            print(f"Parsed {len(insights)} insights")
            
            return insights
            
        except Exception as e:
            error_msg = str(e)
            if "quota" in error_msg.lower() or "billing" in error_msg.lower():
                print("⚠️ OpenAI quota exceeded - check your billing at https://platform.openai.com/usage")
            elif "rate_limit" in error_msg.lower():
                print("⚠️ OpenAI rate limit exceeded - trying again later")
            else:
                print(f"❌ AI service error: {e}")
            
            # Fallback to rule-based insights
            return self._fallback_insights(summary_data, time_series_data)
        """
    
    def _prepare_context(self, summary, time_series, categories, risk) -> Dict[str, Any]:
        """Prepare structured context for AI analysis"""
        
        # Calculate trends
        recent_claims = sum(time_series.get('claimed', [])[-7:]) if time_series.get('claimed') else 0
        earlier_claims = sum(time_series.get('claimed', [])[:7]) if time_series.get('claimed') else 0
        trend_direction = "increasing" if recent_claims > earlier_claims else "decreasing" if recent_claims < earlier_claims else "stable"
        
        # Top categories
        created_categories = categories.get('created', {})
        claimed_categories = categories.get('claimed', {})
        top_created = max(created_categories, key=created_categories.get) if created_categories else None
        top_claimed = max(claimed_categories, key=claimed_categories.get) if claimed_categories else None
        
        # Risk analysis
        high_risk_count = len([item for item in risk.get('items', []) if item.get('risk_score', 0) > 0.5])
        
        return {
            "platform_stats": {
                "total_items": summary.get('total_items', 0),
                "claim_rate": round(summary.get('claim_rate', 0) * 100, 1),
                "total_claimed": summary.get('total_claimed', 0),
                "total_unclaimed": summary.get('total_unclaimed', 0),
                "donors": summary.get('donors', 0),
                "recipients": summary.get('recipients', 0),
                "items_expiring_24h": summary.get('items_expiring_next_24h', 0)
            },
            "trends": {
                "direction": trend_direction,
                "recent_claims": recent_claims,
                "earlier_claims": earlier_claims,
                "daily_average_created": sum(time_series.get('created', [])) / 14 if time_series.get('created') else 0,
                "daily_average_claimed": sum(time_series.get('claimed', [])) / 14 if time_series.get('claimed') else 0
            },
            "categories": {
                "top_created_category": top_created,
                "top_created_count": created_categories.get(top_created, 0) if top_created else 0,
                "top_claimed_category": top_claimed,
                "top_claimed_count": claimed_categories.get(top_claimed, 0) if top_claimed else 0,
                "total_categories": len(set(list(created_categories.keys()) + list(claimed_categories.keys())))
            },
            "risk_analysis": {
                "high_risk_items": high_risk_count,
                "total_risk_items": len(risk.get('items', [])),
                "most_critical_item": risk.get('items', [{}])[0].get('title') if risk.get('items') else None
            }
        }
    
    def _create_analytics_prompt(self, context: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for AI analysis"""
        
        return f"""
Analyze this FoodBridge platform data and provide 4-6 actionable insights for platform operators:

PLATFORM PERFORMANCE:
- Total items listed: {context['platform_stats']['total_items']}
- Claim rate: {context['platform_stats']['claim_rate']}%
- Items claimed: {context['platform_stats']['total_claimed']}
- Items unclaimed: {context['platform_stats']['total_unclaimed']}
- Active donors: {context['platform_stats']['donors']}
- Active recipients: {context['platform_stats']['recipients']}
- Items expiring in 24h: {context['platform_stats']['items_expiring_24h']}

TRENDS (14-day analysis):
- Claims trend: {context['trends']['direction']}
- Recent week claims: {context['trends']['recent_claims']}
- Previous week claims: {context['trends']['earlier_claims']}
- Daily average created: {context['trends']['daily_average_created']:.1f}
- Daily average claimed: {context['trends']['daily_average_claimed']:.1f}

CATEGORY INSIGHTS:
- Most listed category: {context['categories']['top_created_category']} ({context['categories']['top_created_count']} items)
- Most claimed category: {context['categories']['top_claimed_category']} ({context['categories']['top_claimed_count']} items)
- Total categories active: {context['categories']['total_categories']}

RISK ANALYSIS:
- High-risk items: {context['risk_analysis']['high_risk_items']} out of {context['risk_analysis']['total_risk_items']}
- Most critical item: {context['risk_analysis']['most_critical_item']}

Please provide insights that are:
1. Actionable and specific
2. Data-driven and quantified
3. Focused on reducing waste and improving efficiency
4. Relevant for platform operators and food rescue coordinators

Format as bullet points, each insight should be 1-2 sentences maximum.
"""
    
    def _parse_ai_response(self, content: str) -> List[str]:
        """Parse AI response into individual insights"""
        if not content:
            return ["AI analysis unavailable at this time."]
        
        # Split by bullet points or newlines
        lines = content.strip().split('\n')
        insights = []
        
        for line in lines:
            line = line.strip()
            if line and (line.startswith('•') or line.startswith('-') or line.startswith('*')):
                # Remove bullet point markers
                insight = line.lstrip('•-* ').strip()
                if insight and len(insight) > 10:  # Filter out very short lines
                    insights.append(insight)
            elif line and len(line) > 20 and not line.startswith('#'):  # Catch insights without bullets
                insights.append(line)
        
        # Fallback if parsing fails
        if not insights:
            insights = [content[:200] + "..." if len(content) > 200 else content]
        
        return insights[:6]  # Limit to 6 insights max
    
    def _enhanced_rule_insights(self, summary_data: Dict[str, Any], time_series_data: Dict[str, Any], categories_data: Dict[str, Any], risk_data: Dict[str, Any]) -> List[str]:
        """Enhanced rule-based insights with sophisticated analysis"""
        insights = []
        
        claim_rate = summary_data.get('claim_rate', 0) * 100
        total_items = summary_data.get('total_items', 0)
        total_claimed = summary_data.get('total_claimed', 0)
        total_unclaimed = summary_data.get('total_unclaimed', 0)
        expiring_24h = summary_data.get('items_expiring_next_24h', 0)
        donors = summary_data.get('donors', 0)
        recipients = summary_data.get('recipients', 0)
        
        # Performance analysis with benchmarks
        if claim_rate >= 85:
            insights.append(f"Outstanding {claim_rate:.1f}% claim rate exceeds industry benchmarks (60-75%) - your matching system is highly optimized.")
        elif claim_rate >= 70:
            insights.append(f"Strong {claim_rate:.1f}% claim rate shows effective donor-recipient connections - fine-tune timing for even better results.")
        elif claim_rate >= 50:
            insights.append(f"Solid {claim_rate:.1f}% claim rate with growth potential - consider targeted outreach in underperforming categories.")
        else:
            insights.append(f"{claim_rate:.1f}% claim rate indicates opportunity for improved matching algorithms and recipient engagement strategies.")
        
        # Advanced trend analysis
        if time_series_data.get('claimed') and len(time_series_data['claimed']) >= 7:
            recent_7 = time_series_data['claimed'][-7:]
            earlier_7 = time_series_data['claimed'][:7] if len(time_series_data['claimed']) >= 14 else time_series_data['claimed'][:-7]
            
            if recent_7 and earlier_7:
                recent_avg = sum(recent_7) / len(recent_7)
                earlier_avg = sum(earlier_7) / len(earlier_7)
                change_pct = ((recent_avg - earlier_avg) / max(earlier_avg, 1)) * 100
                
                if change_pct > 20:
                    insights.append(f"Claims surging with {change_pct:+.1f}% growth - capitalize on momentum with expanded donor outreach.")
                elif change_pct > 5:
                    insights.append(f"Steady growth of {change_pct:+.1f}% in claims shows healthy platform adoption - maintain current strategies.")
                elif change_pct < -15:
                    insights.append(f"Claims declined {change_pct:.1f}% - investigate seasonal factors or implement retention campaigns.")
                else:
                    insights.append(f"Stable claim patterns ({change_pct:+.1f}%) indicate consistent community engagement.")
        
        # Category intelligence
        created_cats = categories_data.get('created', {})
        claimed_cats = categories_data.get('claimed', {})
        
        if created_cats and claimed_cats:
            # Find categories with low claim rates
            low_conversion_cats = []
            for cat, created_count in created_cats.items():
                claimed_count = claimed_cats.get(cat, 0)
                if created_count >= 3 and claimed_count / created_count < 0.5:
                    low_conversion_cats.append((cat, claimed_count / created_count))
            
            if low_conversion_cats:
                worst_cat, worst_rate = min(low_conversion_cats, key=lambda x: x[1])
                insights.append(f"'{worst_cat}' category shows {worst_rate:.0%} claim rate - optimize timing, descriptions, or recipient targeting.")
            
            # Find high-performing categories
            high_performers = [(cat, claimed_cats.get(cat, 0) / created_count) 
                             for cat, created_count in created_cats.items() 
                             if created_count >= 2 and claimed_cats.get(cat, 0) / created_count >= 0.8]
            
            if high_performers:
                best_cat, best_rate = max(high_performers, key=lambda x: x[1])
                insights.append(f"'{best_cat}' category excels with {best_rate:.0%} claim rate - replicate success factors across other categories.")
        
        # Risk and urgency analysis
        risk_items = risk_data.get('items', [])
        if risk_items:
            high_risk_count = sum(1 for item in risk_items if item.get('risk_score', 0) > 0.7)
            medium_risk_count = sum(1 for item in risk_items if 0.3 < item.get('risk_score', 0) <= 0.7)
            
            if high_risk_count >= 3:
                insights.append(f"{high_risk_count} critical-risk items need immediate attention - deploy urgent pickup notifications.")
            elif high_risk_count > 0:
                insights.append(f"{high_risk_count} high-risk items identified - prioritize these in next 4-6 hours to prevent waste.")
            elif medium_risk_count > 0:
                insights.append(f"{medium_risk_count} medium-risk items tracked - good pipeline management with proactive monitoring.")
            else:
                insights.append("All items have low spoilage risk - excellent inventory turnover and timing.")
        
        # Community health metrics
        if donors > 0 and recipients > 0:
            donor_recipient_ratio = donors / recipients
            if donor_recipient_ratio > 2:
                insights.append(f"{donors} donors vs {recipients} recipients - expand recipient outreach to match supply capacity.")
            elif donor_recipient_ratio < 0.5:
                insights.append(f"{recipients} recipients vs {donors} donors - strong demand suggests opportunity for donor acquisition.")
            else:
                insights.append(f"Balanced community with {donors} donors and {recipients} recipients - healthy supply-demand ratio.")
        
        # Efficiency insights
        if total_items > 0:
            efficiency_score = (total_claimed / total_items) * (1 - (expiring_24h / max(total_items, 1))) * 100
            if efficiency_score >= 80:
                insights.append(f"Platform efficiency score: {efficiency_score:.0f}/100 - exceptional waste prevention and matching performance.")
            elif efficiency_score >= 60:
                insights.append(f"Platform efficiency score: {efficiency_score:.0f}/100 - strong performance with room for optimization.")
            else:
                insights.append(f"Platform efficiency score: {efficiency_score:.0f}/100 - focus on faster matching and expiry management.")
        
        return insights[:5]  # Return up to 5 enhanced insights
    
    def _fallback_insights(self, summary_data: Dict[str, Any], time_series_data: Dict[str, Any]) -> List[str]:
        """Simple fallback when enhanced analysis isn't available"""
        claim_rate = summary_data.get('claim_rate', 0) * 100
        expiring_24h = summary_data.get('items_expiring_next_24h', 0)
        
        return [
            f"Platform claim rate: {claim_rate:.1f}% ({summary_data.get('total_claimed', 0)}/{summary_data.get('total_items', 0)} items)",
            f"Items expiring in 24h: {expiring_24h}",
            "Enhanced insights temporarily unavailable - using basic analysis"
        ]


# Global AI service instance
ai_service = AIService()
