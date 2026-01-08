"use client";
import { useState, useEffect } from "react";

interface Answer {
  author: string;
  content: string;
  likes?: string[];
  createdAt: string;
}

interface Question {
  _id: string;
  title: string;
  username: string;
  userId: string; // author userId
  tags?: string[];
  likes?: string[];
  answers?: Answer[];
  createdAt: string;
}

export default function QuestionsComponent() {
  const [latestQuestions, setLatestQuestions] = useState<Question[]>([]);
  const [topQuestions, setTopQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [user, setUser] = useState<{ username: string; userId: string } | null>(
    null
  );

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [searchDate, setSearchDate] = useState(""); // YYYY-MM-DD

  // Get user from JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ username: payload.username, userId: payload.userId });
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch("/api/questions");
      const data: Question[] = await res.json();
      const normalized = data.map((q) => ({
        ...q,
        likes: q.likes || [],
        answers: q.answers || [],
      }));

      setLatestQuestions(normalized.slice(0, 5));

      const top = [...normalized].sort(
        (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
      );
      setTopQuestions(top.slice(0, 5));
    }
    fetchQuestions();
  }, []);

  // Filter questions based on search
  const filteredQuestions = latestQuestions.filter((q) => {
    const matchesTitle = q.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTag = searchTag
      ? q.tags?.some((t) => t.toLowerCase().includes(searchTag.toLowerCase()))
      : true;
    const matchesDate = searchDate
      ? new Date(q.createdAt).toISOString().slice(0, 10) === searchDate
      : true;
    return matchesTitle && matchesTag && matchesDate;
  });

  // Render a single question card
  const renderQuestion = (q: Question) => (
    <div key={q._id} className="p-3 border rounded hover:bg-gray-50">
      <h3 className="font-semibold bg-white text-black">{q.title}</h3>
      <p className="text-gray-600 text-sm">
        Asked by {q.username} • {new Date(q.createdAt).toLocaleString()}
      </p>
      <p className="text-gray-600 text-sm">
        {q.likes?.length || 0} Likes • {q.answers?.length || 0} Answers
      </p>

      {/* Update button/form for own questions without answers/likes */}
      {user &&
        q.userId === user.userId &&
        q.answers?.length === 0 &&
        q.likes?.length === 0 && (
          <div className="mt-2">
            {editingId === q._id ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem("token");
                  if (!token) {
                    alert("No token found");
                    return;
                  }

                  const res = await fetch(`/api/questions/${q._id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title: newTitle, tags: newTags }),
                  });

                  if (res.ok) {
                    alert("Question updated!");
                    setEditingId(null);
                    window.location.reload();
                  } else {
                    const data = await res.json();
                    alert(data.message || "Update failed");
                  }
                }}
                className="flex flex-col gap-2 mt-2"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Update title"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  value={newTags.join(",")}
                  onChange={(e) =>
                    setNewTags(e.target.value.split(",").map((t) => t.trim()))
                  }
                  placeholder="Tags (comma separated)"
                  className="border p-2 rounded"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-green-500 text-black rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => {
                  setEditingId(q._id);
                  setNewTitle(q.title);
                  setNewTags(q.tags || []);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mt-2"
              >
                Update
              </button>
            )}
          </div>
        )}
    </div>
  );

  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Search inputs */}
      <div className="md:col-span-2 flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by word..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          type="text"
          placeholder="Search by tag..."
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* Latest Questions */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 bg-white text-black ">
          Latest Questions
        </h2>
        <div className="space-y-3">
          {user
            ? filteredQuestions.length > 0
              ? filteredQuestions.map(renderQuestion)
              : "No questions found."
            : "Loading user..."}
        </div>
      </section>

      {/* Top Questions */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 bg-white text-black">
          Top Questions
        </h2>
        <div className="space-y-3">{topQuestions.map(renderQuestion)}</div>
      </section>
    </main>
  );
}
