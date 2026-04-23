/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useApp } from "../context";
import { Stream } from "../types";
import VideoPlayer from "./VideoPlayer";

export default function Dashboard() {
  const {
    credentials,
    authData,
    categories,
    streams,
    selectedCategory,
    loading,
    error,
    logout,
    selectCategory,
    clearError,
  } = useApp();

  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredStreams = streams.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const streamUrl = activeStream
    ? `/api/stream?url=${encodeURIComponent(
        `${credentials!.server}/live/${credentials!.username}/${credentials!.password}/${activeStream.stream_id}.m3u8`
      )}`
    : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-light hover:text-foreground lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                />
              </svg>
            </div>
            <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">
              StreamVault
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {authData?.user_info && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted">
                {authData.user_info.username}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/10 px-4 py-2">
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={clearError}
            className="ml-4 text-xs text-red-400 underline hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 top-14 z-30 w-64 border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                Live TV Categories
              </h2>
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
              {categories.length === 0 && loading && (
                <div className="flex flex-col gap-2 p-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 animate-pulse rounded-lg bg-surface-light"
                    />
                  ))}
                </div>
              )}

              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => {
                    selectCategory(cat);
                    // Close sidebar on mobile
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedCategory?.category_id === cat.category_id
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                  <span className="truncate">{cat.category_name}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-20 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Content Header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {selectedCategory?.category_name || "Select a Category"}
                </h1>
                {!loading && streams.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted">
                    {filteredStreams.length} channel
                    {filteredStreams.length !== 1 ? "s" : ""}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                )}
              </div>

              {streams.length > 0 && (
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent sm:w-64"
                  />
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && streams.length === 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-surface-light" />
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-3/4 rounded bg-surface-light" />
                      <div className="h-3 w-1/2 rounded bg-surface-light" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && streams.length === 0 && selectedCategory && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  className="mb-3 h-16 w-16 text-border"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
                <p className="text-sm text-muted">
                  No channels found in this category.
                </p>
              </div>
            )}

            {/* No Search Results */}
            {!loading && streams.length > 0 && filteredStreams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  className="mb-3 h-16 w-16 text-border"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="text-sm text-muted">
                  No channels match &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

            {/* Channel Grid */}
            {filteredStreams.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredStreams.map((stream) => (
                  <button
                    key={stream.stream_id}
                    onClick={() => setActiveStream(stream)}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-accent/30 hover:bg-surface-hover"
                  >
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-light">
                      {stream.stream_icon ? (
                        <img
                          src={stream.stream_icon}
                          alt=""
                          className="h-full w-full object-contain p-1"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <svg
                        className={`h-5 w-5 text-muted ${stream.stream_icon ? "hidden" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-accent">
                        {stream.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-success" />
                        <span className="text-xs text-muted">Live</span>
                      </div>
                    </div>

                    <svg
                      className="h-5 w-5 shrink-0 text-border transition-colors group-hover:text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Video Player Modal */}
      {activeStream && (
        <VideoPlayer
          stream={activeStream}
          streamUrl={streamUrl}
          onClose={() => setActiveStream(null)}
        />
      )}
    </div>
  );
}
