"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateQuestion from "./componenets/CreateQuestion";
import QuestionsComponent from "./questions/QuestionsComponent";
export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ username: string; userId: string } | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
        setUser({ username: payload.username, userId: payload.userId }); // <-- use payload.id
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login"); // redirect to login page
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow p-4 flex items-center justify-between">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">Q&A Platform</div>

        {/* Search Bar */}
        <div className="flex-1 mx-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search questions..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="px-4 py-2">{user.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Create Question */}
      {user && <CreateQuestion userId={user.userId} username={user.username} />}

      <QuestionsComponent />
    </div>
  );
}
