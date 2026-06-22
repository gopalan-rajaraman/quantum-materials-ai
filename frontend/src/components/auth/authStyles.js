export const AUTH_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .signup-root * { box-sizing: border-box; }

  .su-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 11px 14px 11px 40px;
    font-size: 14px;
    color: #1e293b;
    outline: none;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-input::placeholder { color: #94a3b8; font-size: 13.5px; }
  .su-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .su-select {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 11px 14px 11px 40px;
    font-size: 14px;
    color: #1e293b;
    outline: none;
    background: white;
    appearance: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .action-btn {
    width: 100%;
    background: linear-gradient(135deg,#6366f1,#4f46e5);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px;
    font-size: 15.5px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 18px rgba(99,102,241,0.35);
    letter-spacing: 0.01em;
  }
  .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .form-panel { animation: fadeSlideIn 0.3s ease forwards; }

  .pw-strength-bar {
    height: 4px;
    border-radius: 4px;
    transition: width 0.3s ease, background 0.3s ease;
  }
`;
