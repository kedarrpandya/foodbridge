import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalyticsSummary, getAnalyticsSeries, getAnalyticsCategories, getAnalyticsForecast, getRisk, getCohorts, getAnalyticsExplain, getDetailedAnalyticsExplain, getAnalyticsLocations, getAnalyticsContributors, getAnalyticsPredictions } from '../lib/api'
import ItemsList from '../components/ItemsList'

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'insights'>('analytics')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [lockedCategory, setLockedCategory] = useState<string | null>(null)
  const [crosshairIdx, setCrosshairIdx] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<'item' | 'category' | 'quantity' | 'hours_left' | 'risk_score'>('risk_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const summary = useQuery({ queryKey: ['analytics-summary'], queryFn: getAnalyticsSummary })
  const series = useQuery({ queryKey: ['analytics-series', 14], queryFn: () => getAnalyticsSeries(14) })
  const categories = useQuery({ queryKey: ['analytics-categories', 30], queryFn: () => getAnalyticsCategories(30) })
  const forecast = useQuery({ queryKey: ['analytics-forecast', 14, 7], queryFn: () => getAnalyticsForecast(14, 7) })
  const risk = useQuery({ queryKey: ['analytics-risk', 10], queryFn: () => getRisk(10) })
  const cohorts = useQuery({ queryKey: ['analytics-cohorts', 12], queryFn: () => getCohorts(12) })
  const locations = useQuery({ queryKey: ['analytics-locations', 10], queryFn: () => getAnalyticsLocations(10) })
  const contributors = useQuery({ queryKey: ['analytics-contributors', 10], queryFn: () => getAnalyticsContributors(10) })
  const predictions = useQuery({ queryKey: ['analytics-predictions'], queryFn: getAnalyticsPredictions })
  const explain = useQuery({ queryKey: ['analytics-explain'], queryFn: getAnalyticsExplain, enabled: false })
  const detailedExplain = useQuery({ queryKey: ['analytics-explain-detailed'], queryFn: getDetailedAnalyticsExplain, enabled: false })

  useEffect(() => {
    if (activeTab === 'insights' && !explain.data && !explain.isFetching) {
      explain.refetch()
    }
  }, [activeTab])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-2">Analytics</h1>

      {/* Local page tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
            activeTab === 'analytics'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors inline-flex items-center gap-2 ${
            activeTab === 'insights'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v2M5.2 5.2l1.4 1.4M3 12h2M5.2 18.8l1.4-1.4M12 19v2M17.4 17.4l1.4 1.4M19 12h2M17.4 6.6l1.4-1.4"/></svg>
          AI Insights
        </button>
      </div>

      {activeTab === 'analytics' && (
      <div>
      {/* KPIs with sparklines */}
      {summary.isLoading ? (
        <div className="p-6">Loading analytics…</div>
      ) : summary.isError || !summary.data ? (
        <div className="p-6">Failed to load analytics.</div>
      ) : (
        <div className="grid grid-cols-12 gap-6 mb-8">
          <GlassCard className="col-span-12 lg:col-span-3"><CountUpMetric label="Total Items" value={summary.data.total_items} color="text-gray-900" spark={series.data?.created || []} sparkColor="#6b7280" hint="Total items listed in the selected period." accent="#6b7280" /></GlassCard>
          <GlassCard className="col-span-12 lg:col-span-3"><CountUpMetric label="Claimed" value={summary.data.total_claimed} color="text-green-700" spark={series.data?.claimed || []} sparkColor="#16a34a" hint="Items successfully claimed (picked up)." accent="#16a34a" /></GlassCard>
          <GlassCard className="col-span-12 lg:col-span-3"><CountUpMetric label="Unclaimed" value={summary.data.total_unclaimed} color="text-orange-700" spark={(series.data? series.data.created.map((c,i)=>Math.max(c-(series.data!.claimed[i]||0),0)): [])} sparkColor="#f59e0b" hint="Listed but not yet claimed." accent="#f59e0b" /></GlassCard>
          <GlassCard className="col-span-12 lg:col-span-3"><CountUpMetric label="Claim Rate" value={Math.round(summary.data.claim_rate * 100)} suffix="%" color="text-blue-700" spark={(series.data && series.data.created.length===series.data.claimed.length ? series.data.created.map((c,i)=> c>0? Math.round((series.data!.claimed[i]/Math.max(1,c))*100):0): [])} sparkColor="#3b82f6" hint="Share of listed items that were claimed." accent="#3b82f6" /></GlassCard>
        </div>
      )}

      {/* Hero time series */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Daily Items vs Claims (14 days)</h2>
          <InfoButton text="Time series of items created (supply) and claimed (demand). Divergence hints at bottlenecks or marketing opportunities." />
        </div>
        {series.isLoading ? (
          <div className="py-10 text-center text-gray-500">Loading chart…</div>
        ) : series.isError || !series.data ? (
          <div className="py-10 text-center text-gray-500">Failed to load time series.</div>
        ) : (
          <AreaLineChart labels={series.data.labels} series={[{ name: 'Created', color: '#2563eb', data: series.data.created }, { name: 'Claimed', color: '#16a34a', data: series.data.claimed }]} externalHoverIdx={crosshairIdx} onHoverChange={setCrosshairIdx} />
        )}
      </GlassCard>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Category Breakdown (Created)</h2>
            <InfoButton text="Top categories by listings. Use for partnerships and targeted outreach where supply is high." />
          </div>
          {categories.isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading…</div>
          ) : categories.isError || !categories.data ? (
            <div className="py-10 text-center text-gray-500">Failed to load.</div>
          ) : (
            <InteractiveDonutChart 
              data={categoriesToPairs(categories.data.created)} 
              colors={["#60a5fa", "#34d399", "#f97316", "#a78bfa", "#f43f5e", "#10b981", "#fb7185"]}
              selected={lockedCategory ?? activeCategory}
              onHover={(c)=>{ setActiveTab('analytics'); setActiveCategory(c) }}
              onClickLabel={(c)=> setLockedCategory(prev => prev === c ? null : c)}
            />
          )}
          {lockedCategory && (
            <div className="mt-2 text-xs text-gray-600">Selected: <span className="font-semibold">{lockedCategory}</span> <button className="ml-2 underline" onClick={()=>setLockedCategory(null)}>Clear</button></div>
          )}
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Category Breakdown (Claimed)</h2>
            <InfoButton text="Top categories by successful claims. Compare with Created to see conversion gaps by category." />
          </div>
          {categories.isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading…</div>
          ) : categories.isError || !categories.data ? (
            <div className="py-10 text-center text-gray-500">Failed to load.</div>
          ) : (
            <CategoryCompareChart 
              created={categories.data.created} 
              claimed={categories.data.claimed}
              selected={lockedCategory ?? activeCategory}
              onHover={(c)=>setActiveCategory(c)}
              onClickLabel={(c)=> setLockedCategory(prev => prev === c ? null : c)}
            />
          )}
          {lockedCategory && (
            <div className="mt-2 text-xs text-gray-600">Selected: <span className="font-semibold">{lockedCategory}</span> <button className="ml-2 underline" onClick={()=>setLockedCategory(null)}>Clear</button></div>
          )}
        </GlassCard>
      </div>

      {/* Filtered items by locked category */}
      {lockedCategory && (
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Items in “{lockedCategory}”</h3>
            <button className="underline text-sm" onClick={()=>setLockedCategory(null)}>Clear selection</button>
          </div>
          <ItemsList category={lockedCategory} />
        </GlassCard>
      )}

      {/* Claimed vs Unclaimed */}
      {summary.data && (
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Claimed vs Unclaimed</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Percent of all items</span>
              <InfoButton text="Shows the share of items that were claimed vs remained unclaimed. Aim to reduce unclaimed by better matching and reminders." />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <DonutChart data={[["Claimed", summary.data.total_claimed], ["Unclaimed", summary.data.total_unclaimed]]} colors={["#16a34a", "#f59e0b"]} />
            <div className="text-sm text-gray-600">
              <p className="mb-1"><span className="inline-block w-2 h-2 rounded-sm mr-2" style={{background:'#16a34a'}}></span>Claimed: {summary.data.total_claimed}</p>
              <p className="mb-1"><span className="inline-block w-2 h-2 rounded-sm mr-2" style={{background:'#f59e0b'}}></span>Unclaimed: {summary.data.total_unclaimed}</p>
              <p className="text-gray-500 mt-2">Higher claim share suggests strong matching; aim to push unclaimed down via reminders and routing.</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Forecast */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">7-day Forecast</h2>
          <InfoButton text="Short-term forecast using linear regression over recent days. Replace with Prophet/XGBoost for production." />
        </div>
        {forecast.isLoading ? (
          <div className="py-10 text-center text-gray-500">Computing forecast…</div>
        ) : forecast.isError || !forecast.data ? (
          <div className="py-10 text-center text-gray-500">Failed to compute forecast.</div>
        ) : (
          <AreaLineChart labels={forecast.data.labels} series={[{ name: 'Created (pred)', color: '#93c5fd', data: forecast.data.created }, { name: 'Claimed (pred)', color: '#86efac', data: forecast.data.claimed }]} externalHoverIdx={crosshairIdx} onHoverChange={setCrosshairIdx} />
        )}
        <p className="text-xs text-gray-500 mt-2">Method: simple linear regression on past 14 days. Replace with Prophet/XGBoost later.</p>
      </GlassCard>

      {/* Risk table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">High-Risk Items (likely to expire)</h2>
          <InfoButton text="Prioritize pickups. Risk combines hours to expiry and quantity. Replace with ML classifier for smarter triage." />
        </div>
        {risk.isLoading ? (
          <div className="py-10 text-center text-gray-500">Loading risk…</div>
        ) : risk.isError || !risk.data ? (
          <div className="py-10 text-center text-gray-500">Failed to load risk.</div>
        ) : risk.data.items.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <div className="mb-2">No high-risk items found!</div>
            <div className="text-xs text-gray-400 max-w-md mx-auto">
              Great news! All items are either claimed or have plenty of time before expiry. 
              High-risk items will appear here when there are unclaimed items close to their expiry date.
            </div>
            <div className="mt-3 text-xs text-blue-600">
              Try adding new items via the "Donate Food" page to see risk analysis in action.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <SortableTh label="Item" active={sortKey==='item'} dir={sortDir} onClick={()=>{ setSortKey('item'); setSortDir(sortKey==='item' && sortDir==='asc' ? 'desc' : 'asc') }} />
                  <SortableTh label="Category" active={sortKey==='category'} dir={sortDir} onClick={()=>{ setSortKey('category'); setSortDir(sortKey==='category' && sortDir==='asc' ? 'desc' : 'asc') }} />
                  <SortableTh label="Qty" active={sortKey==='quantity'} dir={sortDir} onClick={()=>{ setSortKey('quantity'); setSortDir(sortKey==='quantity' && sortDir==='asc' ? 'desc' : 'asc') }} />
                  <SortableTh label="Hours left" active={sortKey==='hours_left'} dir={sortDir} onClick={()=>{ setSortKey('hours_left'); setSortDir(sortKey==='hours_left' && sortDir==='asc' ? 'desc' : 'asc') }} />
                  <SortableTh label="Risk score" active={sortKey==='risk_score'} dir={sortDir} onClick={()=>{ setSortKey('risk_score'); setSortDir(sortKey==='risk_score' && sortDir==='asc' ? 'desc' : 'asc') }} />
                </tr>
              </thead>
              <tbody>
                {[...risk.data.items].sort((a: any, b: any) => {
                  const factor = sortDir === 'asc' ? 1 : -1
                  switch (sortKey) {
                    case 'item': return factor * String(a.title||'').localeCompare(String(b.title||''))
                    case 'category': return factor * String(a.category||'').localeCompare(String(b.category||''))
                    case 'quantity': return factor * ((a.quantity||0) - (b.quantity||0))
                    case 'hours_left': return factor * (((a.hours_left||0) as number) - ((b.hours_left||0) as number))
                    case 'risk_score': default: return factor * ((a.risk_score||0) - (b.risk_score||0))
                  }
                }).map((r: any, i: number) => (
                  <tr key={r.id} className="border-b last:border-none">
                    <td className="py-2 pr-4">{r.title}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.category}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.quantity ?? '-'}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.hours_left ?? '-'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                          <div className="h-full bg-red-500" style={{ width: `${Math.min(100, Math.round(r.risk_score * 100))}%`, transition: 'width 600ms ease' }} />
                        </div>
                        <span className="text-gray-700">{r.risk_score.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">Risk = 1/(1+hours_left) + 0.05*quantity. Upgradeable to ML classification later.</p>
      </GlassCard>

      {/* Cohort retention */}
      <GlassCard className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Donor Cohort Retention (weekly)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Row = cohort week; columns = weeks since first donation</span>
            <InfoButton text="Retention by cohort. Dark cells mean donors kept donating in later weeks. Use to evaluate campaigns." />
          </div>
        </div>
        {cohorts.isLoading ? (
          <div className="py-10 text-center text-gray-500">Building cohorts…</div>
        ) : cohorts.isError || !cohorts.data ? (
          <div className="py-10 text-center text-gray-500">Failed to load cohorts.</div>
        ) : (
          <CohortHeatmap labels={cohorts.data.labels} offsets={cohorts.data.offsets} matrix={cohorts.data.matrix} />
        )}
      </GlassCard>

      {/* ML Predictions */}
      <GlassCard className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Smart Predictions (ML-Powered)</h2>
          <InfoButton text="Machine learning insights for optimal donation timing and location targeting. Based on historical patterns." />
        </div>
        {predictions.isLoading ? (
          <div className="py-10 text-center text-gray-500">Computing predictions...</div>
        ) : predictions.isError || !predictions.data ? (
          <div className="py-10 text-center text-gray-500">Failed to load predictions.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InteractivePredictionChart data={predictions.data.hourly_patterns} type="hourly" predictions={predictions.data.predictions.best_donation_hours} />
              <InteractivePredictionChart data={predictions.data.daily_patterns} type="daily" predictions={predictions.data.predictions.best_donation_days} />
            </div>
            
            {/* AI Explanation Mini Window */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-purple-800">AI Explains: What This Means</h3>
                  <p className="text-purple-600 text-sm">Simple interpretation of the ML predictions</p>
                </div>
              </div>
              <MLExplanation predictions={predictions.data} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-sm font-semibold text-blue-800 mb-1">Next Predicted Peak</div>
                <div className="text-blue-700 font-bold text-lg">{predictions.data?.predictions.next_peak_time || 'Loading...'}</div>
                <div className="text-blue-600 text-xs">Optimal time for donor outreach</div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-sm font-semibold text-green-800 mb-1">Best Day</div>
                <div className="text-green-700 font-bold text-lg">
                  {predictions.data?.predictions.best_donation_days[0]?.day || 'Loading...'}
                </div>
                <div className="text-green-600 text-xs">Highest activity day</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-sm font-semibold text-orange-800 mb-1">Peak Hours</div>
                <div className="text-orange-700 font-bold text-lg">
                  {predictions.data?.predictions.best_donation_hours.slice(0, 2).map(h => `${h.hour}h`).join(', ') || 'Loading...'}
                </div>
                <div className="text-orange-600 text-xs">Most active times</div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Location Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Top Donation Locations</h2>
            <InfoButton text="Locations with highest donation activity. Use for targeted partnerships and supply optimization." />
          </div>
          {locations.isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading locations...</div>
          ) : locations.isError || !locations.data ? (
            <div className="py-10 text-center text-gray-500">Failed to load locations.</div>
          ) : (
            <LocationChart data={locations.data.top_donation_locations} type="donations" />
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Top Claim Locations</h2>
            <InfoButton text="Locations with highest claim activity. Indicates demand hotspots for targeted recipient outreach." />
          </div>
          {locations.isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading locations...</div>
          ) : locations.isError || !locations.data ? (
            <div className="py-10 text-center text-gray-500">Failed to load locations.</div>
          ) : (
            <LocationChart data={locations.data.top_claim_locations} type="claims" />
          )}
        </GlassCard>
      </div>

      {/* Contributors Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Top Donors</h2>
            <InfoButton text="Community members contributing the most food items. Recognize and engage top contributors." />
          </div>
          {contributors.isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading contributors...</div>
          ) : contributors.isError || !contributors.data ? (
            <div className="py-10 text-center text-gray-500">Failed to load contributors.</div>
          ) : (
            <LeaderboardChart data={contributors.data.top_donors} type="donations" />
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Top Recipients</h2>
            <InfoButton text="Most active food recipients. Understand demand patterns and community engagement levels." />
          </div>
          {contributors.isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading contributors...</div>
          ) : contributors.isError || !contributors.data ? (
            <div className="py-10 text-center text-gray-500">Failed to load contributors.</div>
          ) : (
            <LeaderboardChart data={contributors.data.top_recipients} type="claims" />
          )}
        </GlassCard>
      </div>

      {/* AI Explanation moved to top tab; removed here */}
      </div>
      )}

      {activeTab === 'insights' && (
      <div className="bg-white rounded-lg shadow-sm p-4 border mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">AI Insights</h2>
            {explain.data?.ai_powered && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                AI Powered
              </span>
            )}
            {explain.data && !explain.data?.ai_powered && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Rule-Based
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md font-semibold shadow hover:bg-gray-800 active:scale-95 transition" onClick={() => explain.refetch()}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v2M5.2 5.2l1.4 1.4M3 12h2M5.2 18.8l1.4-1.4M12 19v2M17.4 17.4l1.4 1.4M19 12h2M17.4 6.6l1.4-1.4"/></svg>
              {explain.isFetching ? 'Analyzing...' : 'Smart Insights'}
            </button>
            <button 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold shadow hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => detailedExplain.refetch()}
              disabled={detailedExplain.isFetching}
              title="Detailed AI analysis using OpenAI (requires quota)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              {detailedExplain.isFetching ? 'AI Analyzing...' : 'AI Report'}
            </button>
          </div>
        </div>
        {(explain.isFetching || detailedExplain.isFetching) ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <span>{detailedExplain.isFetching ? 'OpenAI is analyzing your data...' : 'Analyzing your data...'}</span>
            </div>
          </div>
        ) : (detailedExplain.data || explain.data) ? (
          <>
            {/* Display detailed AI report if available, otherwise regular insights */}
            {detailedExplain.data ? (
              <>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    <span className="text-purple-800 font-semibold text-sm">Detailed AI Analysis</span>
                    {detailedExplain.data.ai_powered && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">OpenAI Powered</span>
                    )}
                  </div>
                  <ul className="space-y-3 text-sm text-gray-700">
                    {detailedExplain.data.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-3 opacity-0 animate-[fadein_0.5s_ease_forwards]" style={{animationDelay:`${i*150}ms`}}>
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-600 text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                  {detailedExplain.data.error && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      Note: {detailedExplain.data.error}
                    </div>
                  )}
                </div>
              </>
            ) : explain.data ? (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <span className="text-blue-800 font-semibold text-sm">Smart Analytics</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Enhanced Rules</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  {explain.data.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-3 opacity-0 animate-[fadein_0.5s_ease_forwards]" style={{animationDelay:`${i*150}ms`}}>
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            
            <div className="flex items-center justify-between pt-3 border-t">
              <p className="text-sm font-semibold text-gray-800">For DETAILED REVIEW, CHECK ANALYTICS.</p>
              <div className="text-xs text-gray-500">
                {detailedExplain.data?.ai_powered && detailedExplain.data?.model && (
                  <span>Powered by {detailedExplain.data.model}</span>
                )}
                {explain.data?.openai_available && !detailedExplain.data && (
                  <span>OpenAI available for detailed reports</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-3">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">Ready to analyze your platform data</p>
            <p className="text-xs text-gray-500">Click "Generate Insights" to get AI-powered recommendations and trends analysis.</p>
          </div>
        )}
        <style>{`@keyframes fadein{to{opacity:1;}}`}</style>
      </div>
      )}

    </div>
  )
}

function CountUpMetric({ label, value, color, suffix = '', spark = [], sparkColor = '#6b7280', hint, accent }: { label: string; value: number; color: string; suffix?: string; spark?: number[]; sparkColor?: string; hint?: string; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const start = 0
    const end = value
    const duration = 600
    const startTs = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTs) / duration)
      const cur = Math.round(start + (end - start) * p)
      el.textContent = `${cur}${suffix}`
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, suffix])

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border group" title={`${label}: ${value}${suffix}`}>
      {accent && <div className="h-1 w-full rounded-full mb-3" style={{ background: accent }} />}
      <div className="flex items-start justify-between">
        <div>
          <div ref={ref} className={`text-2xl font-bold ${color}`}>0{suffix}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
        {hint && (
          <div className="ml-2">
            <InfoButton text={hint} />
          </div>
        )}
      </div>
      {spark.length > 0 && (
        <svg width={160} height={40} className="mt-2">
          {(() => {
            const w = 160, h = 40, p = 6
            const max = Math.max(1, ...spark)
            const step = (w - p * 2) / Math.max(1, spark.length - 1)
            const y = (v: number) => h - p - (v / max) * (h - p * 2)
            const d = spark.map((v, i) => `${i ? 'L' : 'M'} ${p + i * step},${y(v)}`).join(' ')
            return (
              <g>
                <path d={d} fill="none" stroke={sparkColor} strokeWidth={2} opacity={0.9} />
              </g>
            )
          })()}
        </svg>
      )}
      {spark.length > 1 && (() => {
        const last = spark[spark.length - 1]
        const prev = spark[spark.length - 2]
        const diff = last - prev
        const dirUp = diff > 0
        const dirFlat = diff === 0
        const pct = prev === 0 ? 0 : Math.round((diff / Math.max(1, prev)) * 100)
        return (
          <div className={`mt-2 inline-flex items-center text-xs rounded px-2 py-1 ${dirFlat ? 'bg-gray-100 text-gray-600' : dirUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {!dirFlat ? (
              <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d={dirUp ? 'M5 10l4-4 4 4H5z' : 'M5 10l4 4 4-4H5z'} /></svg>
            ) : (
              <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10h10" /></svg>
            )}
            {dirFlat ? 'no change' : `${diff > 0 ? '+' : ''}${diff} (${pct}%) vs prev`}
          </div>
        )
      })()}
    </div>
  )
}

function categoriesToPairs(obj: Record<string, number>) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 7)
}

function DonutChart({ data, colors }: { data: [string, number][]; colors: string[] }) {
  const total = Math.max(1, data.reduce((s, [, v]) => s + v, 0))
  const [active, setActive] = useState<number | null>(null)
  const cx = 120, cy = 120, r = 70, stroke = 24
  let angle = 0
  const arcs = data.map(([label, value], i) => {
    const frac = value / total
    const a0 = angle
    const a1 = angle + frac * Math.PI * 2
    angle = a1
    const large = a1 - a0 > Math.PI ? 1 : 0
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
    return { d, label, value, color: colors[i % colors.length], frac }
  })

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" className="mx-auto">
      <defs>
        <filter id="donut-glow" width="200%" height="200%" x="-50%" y="-50%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="donut-shadow" width="200%" height="200%" x="-50%" y="-50%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} stroke="#f8fafc" strokeWidth={stroke} fill="none" filter="url(#donut-shadow)" />
      {arcs.map((a, i) => {
        const circumference = 2 * Math.PI * r
        const strokeLength = circumference * a.frac
        const isHovered = active === i
        return (
          <g key={i}>
            <path 
              d={a.d} 
              stroke={a.color} 
              strokeWidth={isHovered ? stroke + 6 : stroke} 
              fill="none" 
              strokeLinecap="round" 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: isHovered ? 'url(#donut-glow)' : 'none',
                opacity: active === null ? 1 : (isHovered ? 1 : 0.7)
              }}
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={circumference}
              onMouseEnter={() => setActive(i)} 
              onMouseLeave={() => setActive(null)}
            >
              <animate attributeName="stroke-dashoffset" 
                from={circumference} 
                to={circumference - strokeLength} 
                dur="0.8s" 
                begin={`${i * 0.15}s`} 
                fill="freeze"
                calcMode="spline"
                keySplines="0.4,0,0.2,1"
              />
            </path>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={r-stroke/2-2} fill="white" fillOpacity="0.95" filter="url(#donut-shadow)" />
      <text x={cx} y={cy-8} textAnchor="middle" dominantBaseline="middle" className="fill-gray-800 text-lg font-bold">
        {active === null ? total : arcs[active].value}
      </text>
      <text x={cx} y={cy+8} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-xs">
        {active === null ? 'total' : `${arcs[active].label} (${Math.round((arcs[active].value/total)*100)}%)`}
      </text>
    </svg>
  )
}

function InteractiveDonutChart({ data, colors, selected, onHover, onClickLabel }: { data: [string, number][]; colors: string[]; selected?: string | null; onHover?: (label: string | null) => void; onClickLabel?: (label: string | null) => void }) {
  const [active, setActive] = useState<number | null>(null)
  const total = Math.max(1, data.reduce((s, [, v]) => s + v, 0))
  const cx = 120, cy = 120, r = 70, stroke = 24
  let angle = 0
  const arcs = data.map(([label, value], i) => {
    const frac = value / total
    const a0 = angle
    const a1 = angle + frac * Math.PI * 2
    angle = a1
    const large = a1 - a0 > Math.PI ? 1 : 0
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
    return { d, label, value, color: colors[i % colors.length], frac }
  })

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={240} height={240} viewBox="0 0 240 240" className="mx-auto">
        <defs>
          <filter id="interactive-glow" width="200%" height="200%" x="-50%" y="-50%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="interactive-shadow" width="200%" height="200%" x="-50%" y="-50%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} stroke="#f1f5f9" strokeWidth={stroke} fill="none" filter="url(#interactive-shadow)" />
        {arcs.map((a, i) => {
          const circumference = 2 * Math.PI * r
          const strokeLength = circumference * a.frac
          const isHighlighted = active === i || selected === a.label
          return (
            <path 
              key={i} 
              d={a.d} 
              stroke={a.color} 
              strokeWidth={isHighlighted ? stroke + 6 : stroke} 
              fill="none" 
              strokeLinecap="round" 
              style={{ 
                cursor: 'pointer', 
                opacity: (active === null && !selected) || isHighlighted ? 1 : 0.4,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: isHighlighted ? 'url(#interactive-glow)' : 'none'
              }}
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={circumference}
              onMouseEnter={() => { setActive(i); onHover?.(a.label) }} 
              onMouseLeave={() => { setActive(null); onHover?.(null) }}
            >
              <animate 
                attributeName="stroke-dashoffset" 
                from={circumference} 
                to={circumference - strokeLength} 
                dur="0.9s" 
                begin={`${i * 0.12}s`} 
                fill="freeze"
                calcMode="spline"
                keySplines="0.25,0.1,0.25,1"
              />
            </path>
          )
        })}
        <circle cx={cx} cy={cy} r={r-stroke/2-3} fill="white" fillOpacity="0.98" filter="url(#interactive-shadow)" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 text-sm font-medium">
          {total} total
        </text>
      </svg>
      <div className="min-w-[200px] space-y-1">
        {data.map(([label, value], i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 ${
              active === i || selected === label 
                ? 'bg-gray-50 shadow-sm transform scale-105' 
                : 'hover:bg-gray-25'
            }`}
            onMouseEnter={() => { setActive(i); onHover?.(label) }} 
            onMouseLeave={() => { setActive(null); onHover?.(null) }} 
            onClick={() => onClickLabel?.(label)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ 
                  background: colors[i % colors.length],
                  boxShadow: active === i ? `0 0 8px ${colors[i % colors.length]}40` : 'none'
                }} 
              />
              <span className={`text-gray-700 transition-all ${selected === label ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </div>
            <span className="text-gray-500 font-medium">{value} ({Math.round((value/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data, color }: { data: [string, number][]; color: string }) {
  const width = 360, height = 240, padding = { top: 10, right: 10, bottom: 22, left: 80 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const maxV = Math.max(1, ...data.map(([, v]) => v))
  const barH = Math.min(28, innerH / data.length - 6)

  return (
    <svg width={width} height={height} className="mx-auto">
      {data.map(([label, v], i) => {
        const y = padding.top + i * (barH + 6)
        const w = (v / maxV) * innerW
        return (
          <g key={i}>
            <text x={padding.left - 8} y={y + barH / 2} textAnchor="end" dominantBaseline="middle" className="fill-gray-500 text-[10px]">{label}</text>
            <rect x={padding.left} y={y} width={innerW} height={barH} fill="#f3f4f6" rx={4} />
            <rect x={padding.left} y={y} width={0} height={barH} fill={color} rx={4}>
              <animate attributeName="width" from="0" to={String(w)} dur="0.4s" begin={`${i * 0.06}s`} fill="freeze" />
            </rect>
            <text x={padding.left + w + 6} y={y + barH / 2} className="fill-gray-600 text-[10px]" dominantBaseline="middle">{v}</text>
          </g>
        )
      })}
    </svg>
  )
}

function CategoryCompareChart({ created, claimed, selected, onHover, onClickLabel }: { created: Record<string, number>; claimed: Record<string, number>; selected?: string | null; onHover?: (label: string | null) => void; onClickLabel?: (label: string | null) => void }) {
  const categories = Array.from(new Set([...Object.keys(created), ...Object.keys(claimed)])).sort()
  const rows: Array<{ label: string; created: number; claimed: number }> = categories.map((k) => ({ label: k, created: created[k] || 0, claimed: claimed[k] || 0 }))
  const maxV = Math.max(1, ...rows.map(r => Math.max(r.created, r.claimed)))
  const width = 420, barH = 20, gap = 12, padding = 80
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={rows.length * (barH + gap) + 40}>
        <defs>
          <filter id="bar-glow" width="200%" height="200%" x="-50%" y="-50%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="created-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id="claimed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        {rows.map((r, i) => {
          const y = i * (barH + gap)
          const w1 = (r.created / maxV) * (width - padding - 20)
          const w2 = (r.claimed / maxV) * (width - padding - 20)
          const isHighlighted = selected === r.label || hoveredIdx === i
          const isSelected = selected === r.label
          return (
            <g 
              key={i} 
              onMouseEnter={() => { setHoveredIdx(i); onHover?.(r.label) }} 
              onMouseLeave={() => { setHoveredIdx(null); onHover?.(null) }} 
              onClick={() => onClickLabel?.(r.label)} 
              className="cursor-pointer"
              style={{ transition: 'all 0.3s ease' }}
            >
              <text 
                x={padding - 12} 
                y={y + barH / 2} 
                textAnchor="end" 
                dominantBaseline="middle" 
                className={`text-[12px] transition-all ${isSelected ? 'fill-gray-900 font-bold' : isHighlighted ? 'fill-gray-800 font-semibold' : 'fill-gray-600 font-medium'}`}
              >
                {r.label}
              </text>
              
              {/* Background track */}
              <rect 
                x={padding} 
                y={y} 
                width={width - padding - 20} 
                height={barH} 
                fill="#f8fafc" 
                rx={6}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              
              {/* Created bar */}
              <rect 
                x={padding} 
                y={y + 1} 
                width={0} 
                height={barH - 2} 
                fill="url(#created-gradient)" 
                rx={5}
                opacity={selected && !isSelected ? 0.3 : 1}
                style={{ 
                  filter: isHighlighted ? 'url(#bar-glow)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <animate 
                  attributeName="width" 
                  from="0" 
                  to={String(w1)} 
                  dur="0.8s" 
                  begin={`${i * 0.1}s`} 
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.25,0.1,0.25,1"
                />
              </rect>
              
              {/* Claimed bar */}
              <rect 
                x={padding} 
                y={y + 1} 
                width={0} 
                height={barH - 2} 
                fill="url(#claimed-gradient)" 
                rx={5}
                opacity={selected && !isSelected ? 0.3 : 0.85}
                style={{ 
                  filter: isHighlighted ? 'url(#bar-glow)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <animate 
                  attributeName="width" 
                  from="0" 
                  to={String(w2)} 
                  dur="0.8s" 
                  begin={`${0.1 + i * 0.1}s`} 
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.25,0.1,0.25,1"
                />
              </rect>
              
              <text 
                x={padding + Math.max(w1, w2) + 8} 
                y={y + barH / 2} 
                className={`text-[11px] transition-all ${isHighlighted ? 'fill-gray-800 font-semibold' : 'fill-gray-600'}`} 
                dominantBaseline="middle"
              >
                C: {r.created} / Cl: {r.claimed}
              </text>
            </g>
          )
        })}
        
        {/* Enhanced Legend */}
        <g transform={`translate(${padding}, ${rows.length * (barH + gap) + 15})`}>
          <rect x={0} y={0} width={12} height={12} fill="url(#created-gradient)" rx={3} />
          <text x={18} y={9} className="fill-gray-700 text-[12px] font-medium">Created</text>
          <rect x={90} y={0} width={12} height={12} fill="url(#claimed-gradient)" rx={3} />
          <text x={108} y={9} className="fill-gray-700 text-[12px] font-medium">Claimed</text>
        </g>
      </svg>
    </div>
  )
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/60 bg-white/70 backdrop-blur shadow-sm ${className}`}>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

function AreaLineChart({ labels, series, externalHoverIdx, onHoverChange }: { labels: string[]; series: { name: string; color: string; data: number[] }[]; externalHoverIdx?: number | null; onHoverChange?: (i: number | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  const [animationProgress, setAnimationProgress] = useState(0)
  
  useEffect(() => {
    const recalc = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 100)
    return () => clearTimeout(timer)
  }, [])

  const height = 320
  const padding = { top: 30, right: 30, bottom: 40, left: 50 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxY = Math.max(1, ...series.flatMap(s => s.data))
  const xStep = innerW / Math.max(1, labels.length - 1)
  const yScale = (v: number) => innerH - (v / maxY) * innerH

  const buildPath = (values: number[]) => values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padding.left + i * xStep},${padding.top + yScale(v)}`).join(' ')
  const buildArea = (values: number[]) => `${buildPath(values)} L ${padding.left + (labels.length - 1) * xStep},${padding.top + innerH} L ${padding.left},${padding.top + innerH} Z`

  const [internalHoverIdx, setInternalHoverIdx] = useState<number | null>(null)
  const handleMove = (evt: React.MouseEvent<SVGRectElement>) => {
    const rect = (evt.target as SVGRectElement).getBoundingClientRect()
    const x = evt.clientX - rect.left - padding.left
    const i = Math.max(0, Math.min(labels.length - 1, Math.round(x / xStep)))
    if (onHoverChange) onHoverChange(i); else setInternalHoverIdx(i)
  }

  const handleLeave = () => { if (onHoverChange) onHoverChange(null); else setInternalHoverIdx(null) }

  const hoverIdx = externalHoverIdx ?? internalHoverIdx

  // Grid lines
  const gridLines = 5
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => Math.round((maxY / gridLines) * i))

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg width={width} height={height} className="w-full">
        <defs>
          {series.map((s, i) => (
            <React.Fragment key={i}>
              <linearGradient id={`area-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                <stop offset="50%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id={`line-grad-${i}`} x1="0" y1="0" x2="100%" y2="0">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.8" />
                <stop offset="50%" stopColor={s.color} stopOpacity="1" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.8" />
              </linearGradient>
            </React.Fragment>
          ))}
          <filter id="line-glow" width="200%" height="200%" x="-50%" y="-50%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="point-glow" width="200%" height="200%" x="-50%" y="-50%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {yTicks.map((tick, i) => (
          <g key={i} opacity={animationProgress}>
            <line 
              x1={padding.left} 
              y1={padding.top + yScale(tick)} 
              x2={padding.left + innerW} 
              y2={padding.top + yScale(tick)} 
              stroke="#f1f5f9" 
              strokeWidth={i === 0 ? 1.5 : 1}
            />
            <text 
              x={padding.left - 8} 
              y={padding.top + yScale(tick)} 
              textAnchor="end" 
              dominantBaseline="middle" 
              className="fill-gray-400 text-[11px] font-medium"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#cbd5e1" strokeWidth={1.5} />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#cbd5e1" strokeWidth={1.5} />

        {/* Areas and lines */}
        {series.map((s, idx) => (
          <g key={idx}>
            {/* Area fill */}
            <path 
              d={buildArea(s.data)} 
              fill={`url(#area-grad-${idx})`} 
              style={{
                opacity: animationProgress,
                transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
            
            {/* Line */}
            <path 
              d={buildPath(s.data)} 
              fill="none" 
              stroke={`url(#line-grad-${idx})`} 
              strokeWidth={3} 
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#line-glow)"
              style={{
                opacity: animationProgress,
                transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                strokeDasharray: hoverIdx !== null ? 'none' : `${innerW * 2}`,
                strokeDashoffset: hoverIdx !== null ? 0 : innerW * 2 * (1 - animationProgress),
                transitionDelay: `${idx * 0.2}s`
              }}
            />

            {/* Data points */}
            {s.data.map((v, i) => (
              <circle 
                key={i}
                cx={padding.left + i * xStep} 
                cy={padding.top + yScale(v)} 
                r={hoverIdx === i ? 6 : 4}
                fill="white"
                stroke={s.color}
                strokeWidth={hoverIdx === i ? 3 : 2}
                filter={hoverIdx === i ? "url(#point-glow)" : "none"}
                style={{
                  opacity: animationProgress,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: `${0.5 + idx * 0.1 + i * 0.05}s`
                }}
              />
            ))}
          </g>
        ))}

        {/* X-axis labels */}
        {labels.map((d, i) => (
          <text 
            key={i} 
            x={padding.left + i * xStep} 
            y={padding.top + innerH + 20} 
            textAnchor="middle" 
            className="fill-gray-500 text-[11px] font-medium"
            style={{
              opacity: animationProgress,
              transition: 'opacity 0.6s ease',
              transitionDelay: `${1 + i * 0.05}s`
            }}
          >
            {d.slice(5)}
          </text>
        ))}

        {/* Crosshair and tooltip */}
        {hoverIdx !== null && (
          <g style={{ opacity: animationProgress }}>
            <line 
              x1={padding.left + hoverIdx * xStep} 
              y1={padding.top} 
              x2={padding.left + hoverIdx * xStep} 
              y2={padding.top + innerH} 
              stroke="#94a3b8" 
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.8}
            />
            
            {/* Enhanced tooltip */}
            <g transform={`translate(${Math.min(padding.left + hoverIdx * xStep + 12, padding.left + innerW - 150)}, ${padding.top + 12})`}>
              <rect 
                width={140} 
                height={20 + series.length * 16} 
                rx={8} 
                fill="rgba(15, 23, 42, 0.95)" 
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth={1}
                filter="url(#point-glow)"
              />
              <text x={12} y={16} className="fill-white text-[12px] font-semibold">
                {labels[hoverIdx]}
              </text>
              {series.map((s, i) => (
                <g key={i} transform={`translate(12, ${32 + i * 16})`}>
                  <circle cx={4} cy={-2} r={3} fill={s.color} />
                  <text x={12} y={2} className="fill-white text-[11px] font-medium">
                    {s.name}: {s.data[hoverIdx]}
                  </text>
                </g>
              ))}
            </g>
          </g>
        )}

        {/* Interaction layer */}
        <rect 
          x={padding.left} 
          y={padding.top} 
          width={innerW} 
          height={innerH} 
          fill="transparent" 
          onMouseMove={handleMove} 
          onMouseLeave={handleLeave} 
          style={{ cursor: 'crosshair' }}
        />
      </svg>
    </div>
  )
}

function AnimatedLineChart({ labels, series }: { labels: string[]; series: { name: string; color: string; data: number[] }[] }) {
  const width = 800
  const height = 260
  const padding = { top: 10, right: 20, bottom: 24, left: 36 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxY = Math.max(1, ...series.flatMap(s => s.data))
  const xStep = innerW / Math.max(1, labels.length - 1)
  const yScale = (v: number) => innerH - (v / maxY) * innerH

  function buildPath(values: number[]) {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padding.left + i * xStep},${padding.top + yScale(v)}`).join(' ')
  }

  const gridY = 4
  const yTicks = Array.from({ length: gridY + 1 }, (_, i) => Math.round((maxY / gridY) * i))

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="w-full">
        <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#e5e7eb" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#e5e7eb" />

        {yTicks.map((t, i) => {
          const y = padding.top + yScale(t)
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={padding.left + innerW} y2={y} stroke="#f3f4f6" />
              <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[10px]">{t}</text>
            </g>
          )
        })}

        {labels.map((d, i) => (
          <text key={i} x={padding.left + i * xStep} y={padding.top + innerH + 14} textAnchor="middle" className="fill-gray-400 text-[10px]">
            {d.slice(5)}
          </text>
        ))}

        {series.map((s, idx) => {
          const d = buildPath(s.data)
          return (
            <g key={idx}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} style={{ opacity: 0 }}>
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${idx * 0.1}s`} fill="freeze" />
              </path>
              {s.data.map((v, i) => {
                const cx = padding.left + i * xStep
                const cy = padding.top + yScale(v)
                return (
                  <circle key={i} cx={cx} cy={cy} r={0} fill={s.color}>
                    <animate attributeName="r" from="0" to="3" dur="0.2s" begin={`${0.2 + idx * 0.1 + i * 0.03}s`} fill="freeze" />
                  </circle>
                )
              })}
            </g>
          )
        })}

        {series.map((s, i) => (
          <g key={i}>
            <rect x={padding.left + i * 140} y={8} width={10} height={10} fill={s.color} rx={2} />
            <text x={padding.left + 16 + i * 140} y={16} className="fill-gray-600 text-[12px]">{s.name}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function CohortHeatmap({ labels, offsets, matrix }: { labels: string[]; offsets: number[]; matrix: number[][] }) {
  const cellW = 32, cellH = 28
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left pr-3 pb-2 font-semibold text-gray-700">Cohort Week</th>
              {offsets.map(o => (
                <th key={o} className="px-2 pb-2 text-gray-600 font-medium text-center">+{o}w</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="pr-3 py-1 text-gray-700 font-medium">{labels[i].slice(5)}</td>
                {row.map((v, j) => {
                  const pct = Math.round(v * 100)
                  const intensity = Math.min(v * 1.2, 1) // Boost intensity slightly
                  const hue = v > 0.7 ? 142 : v > 0.4 ? 160 : 180 // Green to blue gradient
                  const saturation = 70 + intensity * 30
                  const lightness = 85 - intensity * 40
                  const bgColor = v === 0 ? '#f8fafc' : `hsl(${hue}, ${saturation}%, ${lightness}%)`
                  const textColor = v > 0.6 ? 'white' : v > 0.3 ? '#1f2937' : '#6b7280'
                  const delay = animationComplete ? 0 : (i * row.length + j) * 30
                  
                  return (
                    <td key={j} className="text-center p-0">
                      <div 
                        className="rounded-lg border border-white/50 font-medium cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:z-10 relative"
                        style={{
                          width: cellW, 
                          height: cellH, 
                          background: bgColor,
                          color: textColor,
                          opacity: animationComplete ? 1 : 0,
                          transform: animationComplete ? 'scale(1)' : 'scale(0.8)',
                          animation: animationComplete ? 'none' : `cohort-fadein 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms forwards`,
                          boxShadow: v > 0 ? `0 2px 8px hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)` : 'none'
                        }}
                        onMouseEnter={(e) => {
                          const rect = (e.target as HTMLDivElement).getBoundingClientRect()
                          setTip({ 
                            x: rect.left + rect.width / 2, 
                            y: rect.top, 
                            text: `Week ${i + 1}, +${j}w: ${pct}% retained` 
                          })
                        }}
                        onMouseLeave={() => setTip(null)}
                      >
                        <div className="flex items-center justify-center h-full text-[10px] font-semibold">
                          {pct}%
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tip && (
        <div 
          className="fixed z-50 px-3 py-2 rounded-lg bg-gray-900 text-white text-[11px] font-medium shadow-lg border border-gray-700 pointer-events-none"
          style={{ 
            left: tip.x - 60, 
            top: tip.y - 40,
            transform: 'translateX(-50%)'
          }}
        >
          {tip.text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
      
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <span>Retention intensity:</span>
        <div className="flex items-center gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <div key={i} className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded border border-white/50"
                style={{
                  background: v === 0 ? '#f8fafc' : `hsl(${v > 0.7 ? 142 : v > 0.4 ? 160 : 180}, ${70 + v * 30}%, ${85 - v * 40}%)`
                }}
              />
              <span className="text-[10px]">{Math.round(v * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes cohort-fadein {
          from {
            opacity: 0;
            transform: scale(0.8) rotate(-5deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}

function InfoButton({ text }: { text: string }) {
  const id = Math.random().toString(36).slice(2)
  return (
    <div className="relative group inline-block">
      <button aria-describedby={id} className="w-5 h-5 rounded-full border border-gray-300 text-gray-600 grid place-items-center hover:bg-gray-100 focus:outline-none" title="What's this?">
        <span className="text-[11px] font-bold">i</span>
      </button>
      <div id={id} role="tooltip" className="pointer-events-none absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-md p-3 text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </div>
    </div>
  )
}

function SortableTh({ label, active=false, dir='asc', onClick }: { label: string; active?: boolean; dir?: 'asc' | 'desc'; onClick?: () => void }) {
  return (
    <th className="py-2 pr-4 select-none">
      <button onClick={onClick} className={`inline-flex items-center gap-1 ${active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
        {label}
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          {dir==='asc' ? <path d="M7 11l3-3 3 3H7z"/> : <path d="M7 9l3 3 3-3H7z"/>}
        </svg>
      </button>
    </th>
  )
}

function LocationChart({ data, type }: { data: Array<{ address: string; lat: number; lng: number; count: number }>; type: 'donations' | 'claims' }) {
  const maxCount = Math.max(1, ...data.map(d => d.count))
  const color = type === 'donations' ? '#3b82f6' : '#10b981'
  
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          No location data available
        </div>
      ) : (
        data.map((location, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{location.address}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(location.count / maxCount) * 100}%`,
                      background: color
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{location.count}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function LeaderboardChart({ data, type }: { data: Array<{ name: string; email: string; donations?: number; claims?: number }>; type: 'donations' | 'claims' }) {
  const maxCount = Math.max(1, ...data.map(d => (type === 'donations' ? d.donations : d.claims) || 0))
  const color = type === 'donations' ? '#3b82f6' : '#10b981'
  const icon = type === 'donations' ? 'M12 6v6m0 0v6m0-6h6m-6 0H6' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          No contributor data available
        </div>
      ) : (
        data.map((contributor, i) => {
          const count = (type === 'donations' ? contributor.donations : contributor.claims) || 0
          const isTop3 = i < 3
          const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-400 to-gray-500', 'from-amber-600 to-orange-600']
          
          return (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
              isTop3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                isTop3 ? `bg-gradient-to-br ${rankColors[i]}` : 'bg-gray-400'
              }`}>
                {isTop3 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{contributor.name}</div>
                <div className="text-xs text-gray-500 truncate">{contributor.email}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(count / maxCount) * 100}%`,
                        background: color
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    <span className="text-sm font-bold text-gray-700">{count}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function InteractivePredictionChart({ data, type, predictions }: { 
  data: Array<{ hour?: number; day?: string; count: number }>; 
  type: 'hourly' | 'daily';
  predictions: Array<{ hour?: number; day?: string; count: number }>
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const maxCount = Math.max(1, ...data.map(d => d.count))
  const width = 450
  const height = 240
  const padding = { top: 30, right: 30, bottom: 50, left: 50 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  
  const barWidth = innerW / data.length
  const predictedIndices = new Set(
    predictions.map(p => 
      type === 'hourly' 
        ? data.findIndex(d => d.hour === p.hour)
        : data.findIndex(d => d.day === p.day)
    ).filter(i => i !== -1)
  )
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{type} Activity Patterns</h3>
      <div className="relative">
        <svg width={width} height={height} className="mx-auto">
          <defs>
            <linearGradient id={`${type}-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.6"/>
            </linearGradient>
            <linearGradient id={`${type}-predicted`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#047857" stopOpacity="0.7"/>
            </linearGradient>
            <filter id={`${type}-glow`} width="200%" height="200%" x="-50%" y="-50%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((factor, i) => (
            <line 
              key={i}
              x1={padding.left} 
              y1={padding.top + innerH * factor} 
              x2={padding.left + innerW} 
              y2={padding.top + innerH * factor}
              stroke="#f1f5f9" 
              strokeWidth={1}
            />
          ))}
          
          {/* Y-axis labels */}
          {[0, 0.5, 1].map((factor, i) => (
            <text
              key={i}
              x={padding.left - 8}
              y={padding.top + innerH * factor}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-400 text-[10px] font-medium"
            >
              {Math.round(maxCount * (1 - factor))}
            </text>
          ))}
          
          {/* Bars */}
          {data.map((item, i) => {
            const barHeight = (item.count / maxCount) * innerH
            const x = padding.left + i * barWidth + barWidth * 0.15
            const y = padding.top + innerH - barHeight
            const isPredicted = predictedIndices.has(i)
            const isHovered = hoveredIndex === i
            const isSelected = selectedIndex === i
            
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth * 0.7}
                  height={0}
                  fill={isPredicted ? `url(#${type}-predicted)` : `url(#${type}-gradient)`}
                  rx={6}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    filter: isHovered || isSelected ? `url(#${type}-glow)` : 'none',
                    opacity: isSelected ? 1 : (hoveredIndex !== null && !isHovered ? 0.6 : 1)
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                >
                  <animate 
                    attributeName="height" 
                    from="0" 
                    to={String(barHeight)} 
                    dur="0.8s" 
                    begin={`${i * 0.08}s`} 
                    fill="freeze"
                  />
                  <animate 
                    attributeName="y" 
                    from={String(padding.top + innerH)} 
                    to={String(y)} 
                    dur="0.8s" 
                    begin={`${i * 0.08}s`} 
                    fill="freeze"
                  />
                </rect>
                
                {isPredicted && (
                  <g>
                    <circle
                      cx={x + barWidth * 0.35}
                      cy={y - 12}
                      r={4}
                      fill="#10b981"
                      stroke="white"
                      strokeWidth={2}
                      opacity={0}
                    >
                      <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${1.2 + i * 0.08}s`} fill="freeze"/>
                    </circle>
                    <text
                      x={x + barWidth * 0.35}
                      y={y - 20}
                      textAnchor="middle"
                      className="fill-green-700 text-[8px] font-bold"
                      opacity={0}
                    >
                      PEAK
                      <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${1.4 + i * 0.08}s`} fill="freeze"/>
                    </text>
                  </g>
                )}
                
                <text
                  x={x + barWidth * 0.35}
                  y={padding.top + innerH + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${isSelected ? 'fill-blue-700' : 'fill-gray-600'}`}
                >
                  {type === 'hourly' ? `${item.hour}h` : (item.day || '').slice(0, 3)}
                </text>
                
                {(isHovered || isSelected) && (
                  <text
                    x={x + barWidth * 0.35}
                    y={y - 4}
                    textAnchor="middle"
                    className="fill-gray-800 text-[11px] font-bold"
                  >
                    {item.count}
                  </text>
                )}
              </g>
            )
          })}
          
          {/* Hover tooltip */}
          {hoveredIndex !== null && (
            <g>
              <rect
                x={padding.left + hoveredIndex * barWidth + barWidth * 0.15 - 30}
                y={padding.top - 15}
                width={60}
                height={25}
                fill="rgba(0,0,0,0.8)"
                rx={4}
              />
              <text
                x={padding.left + hoveredIndex * barWidth + barWidth * 0.15}
                y={padding.top - 3}
                textAnchor="middle"
                className="fill-white text-[10px] font-medium"
              >
                {data[hoveredIndex].count} items
              </text>
            </g>
          )}
          
          {/* Axes */}
          <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#cbd5e1" strokeWidth={2}/>
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#cbd5e1" strokeWidth={2}/>
        </svg>
        
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
              <span>Historical Data</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded"></div>
              <span>ML Predicted Peak</span>
            </div>
          </div>
          {selectedIndex !== null && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
              Selected: {type === 'hourly' ? `${data[selectedIndex].hour}:00` : data[selectedIndex].day} 
              ({data[selectedIndex].count} donations)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MLExplanation({ predictions }: { predictions: any }) {
  const bestHour = predictions.predictions.best_donation_hours[0]
  const bestDay = predictions.predictions.best_donation_days[0]
  const totalHourlyActivity = predictions.hourly_patterns.reduce((sum: number, h: any) => sum + h.count, 0)
  const totalDailyActivity = predictions.daily_patterns.reduce((sum: number, d: any) => sum + d.count, 0)
  
  return (
    <div className="space-y-3 text-sm text-gray-700">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">1</span>
        </div>
        <p>
          <strong>Best Time:</strong> Most donations happen around {bestHour?.hour}:00. 
          This is when donors are most active, likely due to meal prep or closing hours.
        </p>
      </div>
      
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">2</span>
        </div>
        <p>
          <strong>Best Day:</strong> {bestDay?.day} shows the highest activity with {bestDay?.count} donations. 
          Plan your outreach campaigns and partnerships around this day.
        </p>
      </div>
      
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">3</span>
        </div>
        <p>
          <strong>Pattern Insight:</strong> The data shows {totalHourlyActivity > 50 ? 'consistent' : 'growing'} activity 
          across different times. Use these patterns to optimize volunteer schedules and recipient notifications.
        </p>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
        <div className="text-xs text-purple-700">
          <strong>How to Use:</strong> Schedule donor outreach at {bestHour?.hour}:00 on {bestDay?.day}s 
          for maximum response rates. Green bars show ML-predicted peak times.
        </div>
      </div>
    </div>
  )
}
