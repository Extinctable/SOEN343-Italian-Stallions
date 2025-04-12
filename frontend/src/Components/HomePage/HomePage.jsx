import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import "./HomePage.css";

const HomePage = () => {
  const { user } = useUser();
  const { id: userId, first: username, preference } = user || {};

  // Local states
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamCategory, setStreamCategory] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [description, setDescription] = useState("");
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [recommendationText, setRecommendationText] = useState("");
  const [showRecommendationPopup, setShowRecommendationPopup] = useState(false);
  const [activeDescription, setActiveDescription] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);

  // Preferences list
  const options = [
    "sports", "news", "comedy", "anime", "gaming", "movies", "education", "technology",
    "travel", "music", "fitness", "health", "lifestyle", "fashion", "finance", "politics",
    "food", "documentary", "crime", "history", "sci-fi", "drama", "romance", "action",
    "mystery", "horror", "reality", "DIY", "cars", "entrepreneurship", "podcasts", "science",
    "psychology", "motivational", "vlogs", "pets", "nature", "architecture", "spirituality",
    "challenges"
  ];

  // Fetch streams from server on mount
  useEffect(() => {
    console.log("User from context:", user);
    console.log("User ID is:", userId);
    console.log("Username is:", username);

    fetch("http://localhost:5002/streams")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const upcoming = data.filter((stream) => stream.status === "scheduled");
          const live = data.filter((stream) => stream.status === "live");

          setUpcomingStreams(upcoming);
          setLiveStreams(live);
        } else {
          console.error("Expected array, got:", data);
          setUpcomingStreams([]);
          setLiveStreams([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch streams", err);
        setUpcomingStreams([]);
        setLiveStreams([]);
      });
  }, [userId, user, username]);

  if (!userId) return <p>Loading user...</p>;

  // ======== PREFERENCE HANDLERS ========
  const toggleOption = (option) => {
    if (selected.includes(option)) {
      setSelected(selected.filter((item) => item !== option));
    } else if (selected.length < 5) {
      setSelected([...selected, option]);
    }
  };

  const handleSave = () => {
    const preferenceString = selected.join(", ");
    fetch("http://localhost:5002/set-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, preference: preferenceString }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Preference updated:", data);
        window.location.reload();
      });
  };

  // ======== STREAM CREATION ========
  const handleCreateStream = () => {
    fetch("http://localhost:5002/create-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: streamTitle,
        category: streamCategory,
        scheduled_time: scheduledTime,
        description,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Stream created:", data);
        setStreamTitle("");
        setStreamCategory("");
        setScheduledTime("");
        setDescription("");
        setShowStreamForm(false);
        window.location.reload();
      });
  };

  // ======== GPT RECOMMENDATION ========
  const handleRecommendation = async () => {
    try {
      const res = await fetch("http://localhost:5002/recommend-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preference,
          upcomingStreams,
        }),
      });

      const data = await res.json();
      console.log("GPT RECOMMENDATION:", data);

      if (data.recommendation) {
        setRecommendationText(data.recommendation);
        setShowRecommendationPopup(true);
      } else {
        alert("No recommendation returned.");
      }
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      alert("Failed to get stream recommendation.");
    }
  };

  // ======== RENDER ========
  return (
    <div className="homepage-container">
      <h1 className="homepage-header">Welcome, {username}!</h1>

      {(!preference || preference.trim() === "") ? (
        <div className="noPrefContainer">
          <p className="homepage-subtext">
            {username}, it seems like you haven't yet told us your preferences.
            Let us know so we can recommend the best stream for you!
          </p>
          <button onClick={() => setShowPopup(true)} className="submit-button homePagePreferenceBtn">
            Add Preferences
          </button>
        </div>
      ) : (
        <>
          <p className="current_stream_pref">Your current preferences: {preference}</p>
          <div className="preferenceSection">
            <p className="homepage-subtext">If you don't know which stream to pick, we can help you!</p>
            <button onClick={handleRecommendation} className="submit-button homePagePreferenceBtn">
              Recommend Me a Stream
            </button>
          </div>
        </>
      )}

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Select up to 5 Preferences</h2>
            <div className="options">
              {options.map((option) => (
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
              <button onClick={handleSave} disabled={selected.length === 0}>
                Save
              </button>
              <button onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRecommendationPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2 className="rec_title">Recommended Stream</h2>
            <div style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
              {recommendationText.split("Why:")[0].trim()}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              <strong>Why:</strong> {recommendationText.split("Why:")[1]?.trim()}
            </div>
            <button onClick={() => setShowRecommendationPopup(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="stream-setup">
        <p className="current_stream_pref">
          {username} we know you are a very creative mind, click here to schedule your stream
        </p>
        <button className="submit-button homePagePreferenceBtn" onClick={() => setShowStreamForm(true)}>
          Schedule Stream
        </button>

        {showStreamForm && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>Create a New Stream</h2>
              <input
                type="text"
                placeholder="Stream Title"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="Category"
                value={streamCategory}
                onChange={(e) => setStreamCategory(e.target.value)}
              />
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <textarea
                placeholder="Stream Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="popup-actions">
                <button onClick={handleCreateStream}>Submit</button>
                <button onClick={() => setShowStreamForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== UPCOMING STREAMS SECTION ===== */}
      <div className="stream-carousel">
        <h2 className="current_stream_pref">Upcoming Streams</h2>
        <div className="scroll-container">
          {upcomingStreams.map((stream) => (
            <React.Fragment key={stream.id}>
              <div
                className={`stream-card-upgraded ${
                  activeDescription === stream.id ? "blurred" : ""
                }`}
              >
                <div className="stream-card-details">
                  <p className="stream-title">{stream.title}</p>
                  <p className="stream-category">{stream.category}</p>
                  <p className="stream-time">
                    {new Date(stream.scheduled_time).toLocaleString()}
                  </p>
                  <p className="stream-author">
                    By: {stream.user_first_name} {stream.user_last_name}
                  </p>
                </div>

                <button
                  className="stream-card-button"
                  onClick={() => setActiveDescription(stream.id)}
                >
                  Details
                </button>

                {/* If this is the owner, show "Start Stream" */}
                {stream.user_id === userId && (
                  <button
                    className="stream-card-button start-stream-btn"
                    onClick={() => {
                      fetch("http://localhost:5002/start-stream", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ streamId: stream.id }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          console.log("✅ Stream marked live:", data);
                          window.location.href = "/streamer"; // redirect after update
                        })
                        .catch((err) => {
                          console.error("❌ Failed to start stream", err);
                          alert("Could not start the stream. Try again.");
                        });
                    }}
                  >
                    Start Stream
                  </button>
                )}
              </div>

              {/* Details Overlay */}
              {activeDescription === stream.id && (
                <div
                  className="stream-overlay"
                  onClick={() => setActiveDescription(null)}
                >
                  <div
                    className="stream-overlay-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="stream-description">{stream.description}</p>
                    <button
                      className="close-button"
                      onClick={() => setActiveDescription(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ===== ONGOING STREAMS SECTION ===== */}
      {liveStreams.length > 0 && (
  <div className="stream-carousel">
    <h2 className="current_stream_pref">Ongoing Streams</h2>
    <div className="scroll-container">
      {liveStreams.map((stream) => (
        <React.Fragment key={stream.id}>
          <div
            className="stream-card-upgraded"
            style={{ cursor: "pointer" }}
            onClick={() => {
              // Navigate to your watch page, optionally pass streamId as a query param
              window.location.href = `/viewer?streamId=${stream.id}`;
            }}
          >
            <div className="stream-card-details">
              <p className="stream-title">{stream.title}</p>
              <p className="stream-category">{stream.category}</p>
              <p className="stream-author">By: {stream.user_first_name} {stream.user_last_name}</p>
              <p className="live-badge">🔴 LIVE</p>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
)}

    </div>
  );
};

export default HomePage;
