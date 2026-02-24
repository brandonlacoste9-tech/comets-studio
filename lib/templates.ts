/**
 * Comet Studio Template Library
 * Pre-built components matching the clean design system
 */

export interface Template {
  id: string
  name: string
  description: string
  /** Full runnable component code for Sandpack (default export) */
  code: string
}

export const TEMPLATES: Record<string, Template> = {
  button: {
    id: 'button',
    name: 'Button',
    description: 'Primary, secondary, ghost variants',
    code: `export default function App() {
  return (
    <div className="flex gap-3 p-6">
      <button className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
        Primary
      </button>
      <button className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors">
        Secondary
      </button>
      <button className="px-4 py-2 rounded-lg hover:bg-gray-100 text-slate-700 transition-colors">
        Ghost
      </button>
    </div>
  );
}`,
  },
  card: {
    id: 'card',
    name: 'Card',
    description: 'Content container with header, body, footer',
    code: `export default function App() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm">
      <div className="px-6 py-4 border-b border-gray-100 font-semibold text-slate-900">
        Card Title
      </div>
      <div className="p-6 text-slate-600">
        Card content goes here. Clean, minimal design.
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl text-sm text-slate-500">
        Footer
      </div>
    </div>
  );
}`,
  },
  input: {
    id: 'input',
    name: 'Input',
    description: 'Text input with label and error state',
    code: `export default function App() {
  return (
    <div className="max-w-sm space-y-4 p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">With error</label>
        <input
          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
        />
        <p className="text-sm text-red-600">This field is required</p>
      </div>
    </div>
  );
}`,
  },
  modal: {
    id: 'modal',
    name: 'Modal',
    description: 'Dialog overlay with backdrop',
    code: `import React from 'react';
export default function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="p-6">
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
      >
        Open Modal
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Modal Title</h3>
            <p className="text-slate-600 mb-4">Modal content goes here.</p>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`,
  },
  table: {
    id: 'table',
    name: 'Table',
    description: 'Data table with headers',
    code: `export default function App() {
  const rows = [
    { name: 'Item 1', status: 'Active', value: '$99' },
    { name: 'Item 2', status: 'Pending', value: '$49' },
    { name: 'Item 3', status: 'Active', value: '$149' },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-slate-900">{row.name}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{row.status}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`,
  },
  tabs: {
    id: 'tabs',
    name: 'Tabs',
    description: 'Tab navigation',
    code: `import React from 'react';
export default function App() {
  const [active, setActive] = React.useState(0);
  const tabs = ['Overview', 'Details', 'Settings'];
  return (
    <div className="p-6">
      <div className="flex border-b border-gray-200 gap-6">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={"pb-3 text-sm font-medium border-b-2 transition-colors " +
              (active === i
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-gray-500 hover:text-slate-700")}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-4 text-slate-600">
        Content for {tabs[active]}
      </div>
    </div>
  );
}`,
  },
  dropdown: {
    id: 'dropdown',
    name: 'Dropdown',
    description: 'Menu with options',
    code: `import React from 'react';
export default function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative p-6">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
      >
        Options
        <span className={"transform " + (open ? "rotate-180" : "")}>▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-6 top-14 z-20 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-gray-50">Edit</button>
            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-gray-50">Duplicate</button>
            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}`,
  },
  badge: {
    id: 'badge',
    name: 'Badge',
    description: 'Status labels',
    code: `export default function App() {
  return (
    <div className="flex flex-wrap gap-2 p-6">
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        Default
      </span>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Success
      </span>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        Warning
      </span>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Error
      </span>
    </div>
  );
}`,
  },
  alert: {
    id: 'alert',
    name: 'Alert',
    description: 'Inline notification',
    code: `export default function App() {
  return (
    <div className="max-w-md space-y-3 p-6">
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        Info: Your changes have been saved.
      </div>
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        Warning: Please review before continuing.
      </div>
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
        Error: Something went wrong.
      </div>
    </div>
  );
}`,
  },
  avatar: {
    id: 'avatar',
    name: 'Avatar',
    description: 'User avatar with fallback',
    code: `export default function App() {
  return (
    <div className="flex items-center gap-4 p-6">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
        JD
      </div>
      <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-sm font-medium text-slate-700">
        AB
      </div>
      <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-sm font-medium text-white">
        U
      </div>
    </div>
  );
}`,
  },
}

export const TEMPLATE_LIST = Object.values(TEMPLATES)
