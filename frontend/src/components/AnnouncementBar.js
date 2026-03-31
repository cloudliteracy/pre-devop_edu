import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../services/socket';
import './AnnouncementBar.css';

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncement();
    setupSocketListeners();

    return () => {
      socketService.offAnnouncementEvents();
    };
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/announcements/active');
      console.log('Fetched announcement:', data);
      setAnnouncement(data);
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNewAnnouncement((newAnnouncement) => {
      setAnnouncement(newAnnouncement);
    });

    socketService.onAnnouncementUpdated((updatedAnnouncement) => {
      setAnnouncement(updatedAnnouncement);
    });

    socketService.onAnnouncementDeleted(() => {
      setAnnouncement(null);
    });
  };

  if (!announcement) return null;

  return (
    <div className="announcement-bar">
      <div className="announcement-bar-inner">
        <div className="announcement-scroll">
          <span className="announcement-icon">📢</span>
          <span className="announcement-text">
            <strong>{announcement.title}:</strong> {announcement.content}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
