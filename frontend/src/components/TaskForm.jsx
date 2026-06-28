import React, { useState, useRef } from 'react';

const TaskForm = ({ onSubmit, loading }) => {
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [energy, setEnergy] = useState(5);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef(null);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. You can still type your task.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setDescription((prev) => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (description && deadline && energy) {
      onSubmit({ description, deadline, userEnergy: Number(energy) });
    }
  };

  return (
    <form className="glass-panel task-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>What do you need to get done?</label>
        <textarea 
          rows="3" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Finish the Q3 financial report..."
          required
          disabled={loading}
        ></textarea>
        <button 
          type="button" 
          className={`speech-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={loading}
        >
          🎤 {isRecording ? 'Listening... Click to stop' : 'Use Voice Typing (or type manually)'}
        </button>
      </div>

      <div className="form-group">
        <label>When is the deadline?</label>
        <input 
          type="datetime-local" 
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          disabled={loading}
          style={{ colorScheme: 'dark' }}
        />
      </div>

      <div className="form-group">
        <label>Your current energy level (1-10)</label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={energy}
          onChange={(e) => setEnergy(e.target.value)}
          disabled={loading}
        />
        <div className="energy-display">{energy}</div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Analyzing with AI...' : 'Save My Life'}
      </button>
    </form>
  );
};

export default TaskForm;
