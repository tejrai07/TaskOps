import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../config';

const HabitTracker = ({ token, handleLogout }) => {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const notificationCheckInterval = useRef(null);

  const fetchHabits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/habits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok && (data.error === 'Invalid token' || data.error === 'Access denied')) {
        handleLogout();
        return;
      }
      setHabits(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
    
    // Start notification check loop
    notificationCheckInterval.current = setInterval(() => {
      checkEndOfDayNotification();
    }, 60000); // Check every minute

    return () => clearInterval(notificationCheckInterval.current);
  }, [habits]);

  const checkEndOfDayNotification = () => {
    if (Notification.permission !== 'granted') return;
    
    const now = new Date();
    // Get time in IST
    const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: 'numeric', minute: 'numeric', hour12: false });
    const [hours, minutes] = istTimeStr.split(':').map(Number);
    
    // 8:00 PM IST is 20:00
    if (hours === 20 && minutes === 0) {
      const todayIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' });
      
      const uncompletedCount = habits.filter(h => {
        if (!h.lastCompleted) return true;
        const lastCompletedIST = new Date(h.lastCompleted).toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' });
        return lastCompletedIST !== todayIST;
      }).length;

      if (uncompletedCount > 0) {
        new Notification("The Last-Minute Life Saver", {
          body: `It's 8:00 PM! You have ${uncompletedCount} habits left to complete today. Keep your streak alive!`,
        });
      }
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName) return;
    try {
      await fetch(`${API_BASE}/api/habits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newHabitName })
      });
      setNewHabitName('');
      fetchHabits();
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async (id) => {
    try {
      await fetch(`${API_BASE}/api/habits/${id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchHabits();
    } catch (error) {
      console.error(error);
    }
  };

  const isCompletedToday = (lastCompletedDate) => {
    if (!lastCompletedDate) return false;
    const todayIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' });
    const lastCompletedIST = new Date(lastCompletedDate).toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' });
    return todayIST === lastCompletedIST;
  };

  return (
    <div className="glass-panel">
      <h2 className="habit-header">Habits & Goals Tracker</h2>
      
      <form onSubmit={handleAddHabit} className="habit-form">
        <input 
          type="text" 
          value={newHabitName} 
          onChange={(e) => setNewHabitName(e.target.value)} 
          placeholder="New habit (e.g. Read 10 pages)" 
        />
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <div>
        {habits.map(habit => (
          <div key={habit._id} className="habit-item">
            <div>
              <div className="habit-name">{habit.name}</div>
              <div className="habit-streak">
                <span className="streak-fire">🔥</span> Streak: {habit.streak} days
              </div>
            </div>
            <button 
              className={isCompletedToday(habit.lastCompleted) ? "btn-secondary" : "btn-primary"} 
              onClick={() => handleComplete(habit._id)}
              disabled={isCompletedToday(habit.lastCompleted)}
            >
              {isCompletedToday(habit.lastCompleted) ? "Completed ✅" : "Complete Today"}
            </button>
          </div>
        ))}
        {habits.length === 0 && <p className="empty-state">No habits added yet. Start building your streaks!</p>}
      </div>
    </div>
  );
};

export default HabitTracker;
