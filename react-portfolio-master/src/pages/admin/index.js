import React, { useState, useEffect } from "react";
import "./style.css";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";

export const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessages();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/messages");
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setError(null);
      } else {
        setError("Failed to fetch messages");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${id}/read`, {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        fetchMessages();
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/messages/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          fetchMessages();
        }
      } catch (err) {
        console.error("Error deleting message:", err);
      }
    }
  };

  return (
    <Container className="my-5">
      <Row className="mb-4">
        <Col>
          <h1>Messages Dashboard</h1>
          <p>Total Messages: {messages.length}</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={fetchMessages}>
            Refresh
          </Button>
        </Col>
      </Row>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && messages.length === 0 && (
        <div className="alert alert-info">No messages yet</div>
      )}

      <Row>
        {messages.map((msg) => (
          <Col key={msg._id} lg="6" className="mb-3">
            <Card className={msg.isRead ? "border-success" : "border-warning"}>
              <Card.Header
                className={msg.isRead ? "bg-success" : "bg-warning"}
              >
                <strong>{msg.name}</strong> ({msg.email})
              </Card.Header>
              <Card.Body>
                <p className="card-text">{msg.message}</p>
                <small className="text-muted">
                  {new Date(msg.timestamp).toLocaleString()}
                </small>
              </Card.Body>
              <Card.Footer>
                {!msg.isRead && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => handleMarkAsRead(msg._id)}
                    className="me-2"
                  >
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(msg._id)}
                >
                  Delete
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};
