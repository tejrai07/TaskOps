import React, { useState } from 'react';

const ActionDashboard = ({ result }) => {
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  if (!result) return null;

  if (result.error) {
    return (
      <div className="glass-panel dashboard-panel">
        <div className="ai-message error-message">
          <strong>Error:</strong> {result.error} (Please try again)
        </div>
      </div>
    );
  }

  const { structuredOutput, toolExecuted, toolArgs } = result;
  const { analysis, routing, execution_payload } = structuredOutput;

  const getUrgencyClass = (score) => {
    if (score > 80) return 'high';
    if (score > 50) return 'medium';
    return 'low';
  };

  const formatAction = (action) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatGoogleCalendarDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return '';
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const getCalendarUrl = (args) => {
    if (!args || !args.start_time || args.start_time === 'null' || !args.task_title || args.task_title === 'null') return '#';
    
    const start = formatGoogleCalendarDate(args.start_time);
    if (!start) return '#';

    let end = '';
    if (args.end_time && args.end_time !== 'null') {
      end = formatGoogleCalendarDate(args.end_time);
    } else {
      // Default to 1 hour after start if missing
      const startDate = new Date(args.start_time);
      startDate.setHours(startDate.getHours() + 1);
      end = startDate.toISOString().replace(/-|:|\.\d+/g, '');
    }

    const text = encodeURIComponent(args.task_title);
    const details = args.details && args.details !== 'null' ? encodeURIComponent(args.details) : '';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`;
  };

  return (
    <div className="glass-panel dashboard-panel">
      <div className="metrics">
        <div className="metric-card">
          <h3>Urgency Score</h3>
          <div className={`value ${getUrgencyClass(analysis.calculated_urgency)}`}>
            {analysis.calculated_urgency}
          </div>
        </div>
        <div className="metric-card">
          <h3>Burnout Risk</h3>
          <div className={`value ${getUrgencyClass(analysis.burnout_index)}`}>
            {analysis.burnout_index}
          </div>
        </div>
      </div>

      <div className="ai-message">
        "{execution_payload.user_message}"
      </div>

      {execution_payload.personalized_recommendation && (
        <div className="recommendation-box">
          <strong>💡 AI Tip:</strong> {execution_payload.personalized_recommendation}
        </div>
      )}

      <div className="action-taken">
        <span className="action-icon">⚡</span>
        <div>
          <div className="action-label"><strong>Triggered:</strong> {formatAction(routing.action)}</div>
          {toolExecuted && <div className="action-tool">System Tool: {toolExecuted}</div>}
        </div>
      </div>

      {execution_payload.calendar_event && execution_payload.calendar_event.start_time && execution_payload.calendar_event.start_time !== 'null' && (
        <div className="calendar-section">
          <a href={getCalendarUrl(execution_payload.calendar_event)} target="_blank" rel="noreferrer" className="calendar-link">
            📅 Add to Google Calendar
          </a>
        </div>
      )}

      {execution_payload.actionable_steps && execution_payload.actionable_steps.length > 0 && (
        <div className="steps-section">
          <h4 className="steps-title">Actionable Steps</h4>
          <ul className="checklist">
            {execution_payload.actionable_steps.map((step, i) => (
              <li 
                key={i} 
                className={checkedSteps.has(i) ? 'checked' : ''}
                onClick={() => {
                  const newSet = new Set(checkedSteps);
                  if (newSet.has(i)) newSet.delete(i);
                  else newSet.add(i);
                  setCheckedSteps(newSet);
                }}
              >
                <input 
                  type="checkbox" 
                  checked={checkedSteps.has(i)} 
                  readOnly 
                />
                <span style={{ textDecoration: checkedSteps.has(i) ? 'line-through' : 'none' }}>
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActionDashboard;
