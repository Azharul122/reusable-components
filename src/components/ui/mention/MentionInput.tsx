"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import MentionDropdown from "./MentionDropdown";
export interface MentionUser {
  id: string;
  name: string;
  username: string;
}

/** What actually gets stored/persisted per selected mention. */
export interface SelectedMention {
  username: string;
  name: string;
}

/** Range of the "@query" currently being typed, if any. */
export interface ActiveQuery {
  text: string;
  start: number;
  end: number;
}

/** Payload emitted on submit / onChange. */
export interface MentionData {
  text: string;
  mentions: string[];
}

interface MentionInputProps {
  users: MentionUser[];
  label?: string;
  onChange?: (data: MentionData) => void;
}

/**
 * -----------------------------------------------------------------------
 * MentionInput
 * `position: relative` wrapper containing the input field (with a
 * floating label). Owns all the state: current text, active "@query"
 * range, and the selected mentions. Renders <MentionDropdown /> absolutely
 * inside itself while a mention query is active.
 *
 * Display vs. storage:
 * - The dropdown and the inline text show the user's `name` (readable).
 * - `selectedUsers` state and the data passed to `onChange` / logged on
 *   submit store `username` (the stable, unique identifier).
 * -----------------------------------------------------------------------
 */
export default function MentionInput({
  users,
  label = "Message",
  onChange,
}: MentionInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  // selectedUsers: username is the source of truth, name is kept
  // alongside only so the chips can render something readable.
  const [selectedUsers, setSelectedUsers] = useState<SelectedMention[]>([]);
  const [activeQuery, setActiveQuery] = useState<ActiveQuery | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isFloating = focused || value.length > 0;

  const filteredUsers =
    activeQuery === null
      ? []
      : users.filter((u) =>
          u.name.toLowerCase().includes(activeQuery.text.toLowerCase())
        );

  // Detect an "@query" immediately before the caret on every keystroke.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    setValue(text);

    const uptoCursor = text.slice(0, cursor);
    const match = uptoCursor.match(/@([^\s@]*)$/);

    if (match) {
      setActiveQuery({
        text: match[1],
        start: cursor - match[0].length,
        end: cursor,
      });
    } else {
      setActiveQuery(null);
    }
  };

  const handleSelect = (user: MentionUser) => {
    if (!activeQuery) return;

    // Text shown inline uses the readable name...
    const before = value.slice(0, activeQuery.start);
    const after = value.slice(activeQuery.end);
    const nextValue = `${before}@${user.name} ${after}`;
    const nextCursor = `${before}@${user.name} `.length;

    setValue(nextValue);

    // ...but what gets stored is the username.
    setSelectedUsers((prev) =>
      prev.some((u) => u.username === user.username)
        ? prev
        : [...prev, { username: user.username, name: user.name }]
    );
    setActiveQuery(null);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const removeSelected = (username: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.username !== username));
  };

  // Close the dropdown on outside click.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActiveQuery(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = () => {
    // Stored/emitted payload: usernames only, not display names.
    const data: MentionData = {
      text: value,
      mentions: selectedUsers.map((u) => u.username),
    };
    console.log(data);
    onChange?.(data);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      {/* input + notched floating label (fieldset/legend breaks the border itself) */}
      <div className="relative">
        <fieldset
          className={`m-0 min-w-0 rounded-lg border px-3 pb-2 pt-0 transition-colors ${
            focused ? "border-indigo-500 ring-1 ring-indigo-500" : "border-neutral-300"
          }`}
        >
          <legend
            className={`overflow-hidden whitespace-nowrap px-1 text-xs transition-[max-width,opacity] duration-150 ease-out ${
              isFloating ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
            } ${focused ? "text-indigo-600" : "text-neutral-500"}`}
          >
            {label}
          </legend>

          <input
            ref={inputRef}
            id="mention-input"
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full border-0 bg-transparent p-0 text-sm text-neutral-900 outline-none"
          />
        </fieldset>

        {/* Large centered label shown only while empty and unfocused —
            swaps out for the notch above once the field is active/filled. */}
        {!isFloating && (
          <label
            htmlFor="mention-input"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400"
          >
            {label}
          </label>
        )}

        {activeQuery !== null && (
          <MentionDropdown users={filteredUsers} onSelect={handleSelect} />
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <span
              key={u.username}
              className="flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2 pr-1 text-xs font-medium text-indigo-700"
            >
              {u.name}
              <button
                type="button"
                onClick={() => removeSelected(u.username)}
                className="rounded-full px-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
                aria-label={`Remove ${u.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
      >
        Submit
      </button>
    </div>
  );
}