import { NavLink } from 'react-router-dom';

const baseClass =
  'cursor-pointer rounded-xl px-3.5 py-2.5 font-semibold transition';
const inactiveClass = 'bg-[#eef3f8] text-[#1f2937]';
const activeClass = 'bg-[#2f6fed] text-white';

export function TopNav() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#d8e0ea] bg-white/95 px-6 py-4 backdrop-blur">
      <div className="text-lg font-bold text-[#1f2937]">CSX Navigator</div>

      <nav className="flex flex-wrap gap-2.5">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          Chat
        </NavLink>

        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          Documents
        </NavLink>

        <NavLink
          to="/preferences"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          Preferences
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          Admin
        </NavLink>
      </nav>
    </header>
  );
}
