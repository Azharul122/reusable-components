"use client";

export interface MentionUser {
  id: string;
  name: string;
  username: string;
}


export interface SelectedMention {
  username: string;
  name: string;
}


export interface ActiveQuery {
  text: string;
  start: number;
  end: number;
}


export interface MentionData {
  text: string;
  mentions: string[];
}

interface MentionDropdownProps {
  users: MentionUser[];
  onSelect: (user: MentionUser) => void;
}


export default function MentionDropdown({ users, onSelect }: MentionDropdownProps) {
  if (!users.length) {
    return (
      <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-400 shadow-lg">
        No users found
      </div>
    );
  }

  return (
    <div
      role="listbox"
      className="absolute left-0 top-full z-50 mt-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
    >
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          role="option"
          // onMouseDown (not onClick) fires before the input's onBlur,
          // so the dropdown selection registers before it would close.
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-medium text-white">
            {user.name.charAt(0)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-neutral-800">{user.name}</span>
            <span className="truncate text-xs text-neutral-400">
              @{user.username}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}