// src/SettingsView.tsx
export default function SettingsView() {
  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur-md rounded-xl text-white">
      <h2 className="text-2xl font-bold mb-4">Engine Configurations</h2>
      <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
         <label htmlFor="deepSeekToggle" className="cursor-pointer">Enable Deep-Seek Vector Matching</label>
         <input id="deepSeekToggle" type="checkbox" className="toggle border-indigo-500 bg-indigo-500" defaultChecked title="Enable Deep-Seek Vector Matching" />
      </div>
    </div>
  )
}