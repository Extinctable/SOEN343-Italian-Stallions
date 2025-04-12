import React, { useState } from 'react';
import { useUser } from "../../context/UserContext";
import '../HomePage/HomePage.css'; // Reuse the popup styling

const AccountSettings = () => {
  const { user } = useUser();
  const { id: userId, first: username, preference } = user || {};
  
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState([]);
  
  const options = [
    "sports", "news", "comedy", "anime", "gaming", "movies", "education", "technology",
    "travel", "music", "fitness", "health", "lifestyle", "fashion", "finance", "politics",
    "food", "documentary", "crime", "history", "sci-fi", "drama", "romance", "action",
    "mystery", "horror", "reality", "DIY", "cars", "entrepreneurship", "podcasts", "science",
    "psychology", "motivational", "vlogs", "pets", "nature", "architecture", "spirituality",
    "challenges"
  ];

  if (!userId) return <p>Loading user...</p>;

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      setSelected(selected.filter(item => item !== option));
    } else if (selected.length < 5) {
      setSelected([...selected, option]);
    }
  };

  const handleSave = () => {
    const preferenceString = selected.join(', ');
    fetch("http://localhost:5002/set-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, preference: preferenceString }),
    })
    .then(res => res.json())
    .then(data => {
      console.log("Preference updated:", data);
      window.location.reload(); // Or better: update context state without reload
    });
  };

  return (
    <div className="homepage-container">
      <h1 className="homepage-header">Account Settings</h1>

      <div className="noPrefContainer">
        <p className="homepage-subtext">
          You can update your content preferences below. Current: <strong>{preference || "None"}</strong>
        </p>

        <button onClick={() => setShowPopup(true)} className="submit-button homePagePreferenceBtn">
          Change Preferences
        </button>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Select up to 5 Preferences</h2>
            <div className="options">
              {options.map(option => (
                <button
                  key={option}
                  className={selected.includes(option) ? "selected" : ""}
                  onClick={() => toggleOption(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="popup-actions">
              <button onClick={handleSave} disabled={selected.length === 0}>Save</button>
              <button onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
