import React, { useEffect, useState, useMemo } from "react";

/*
User Directory React component
- Mock internal API (no external calls)
- Features: pagination, search (page/global), sort, filter, table/card view, dark mode, per-page
- Tailwind used via CDN in public/index.html
*/

function generateUsers(totalCount, perPageDefault=6) {
  const firstNames = ["Alice","Bob","Charlie","Diana","Ethan","Fiona","George","Hannah","Ishan","Jaya","Karan","Lina","Mohan","Nisha","Omar","Priya","Quinn","Ravi","Sara","Tanya","Uma","Vikram","Walt","Xena","Yash","Zara"];
  const lastNames = ["Patel","Sharma","Gupta","Kumar","Singh","Bose","Reddy","Das","Ghosh","Iyer","Mehta","Kapoor","Nair","Khan","Ibrahim"];
  const domains = ["example.com","gmail.com","reqres.in","hotmail.com","yahoo.com","company.org"];
  const users = [];
  for (let i = 1; i <= totalCount; i++) {
    const fn = firstNames[(i * 3) % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const domain = domains[(i * 5) % domains.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${(i%9)}@${domain}`;
    const avatar = `https://i.pravatar.cc/150?img=${(i%70)+1}`;
    users.push({
      id: i,
      first_name: fn,
      last_name: ln,
      email,
      avatar
    });
  }
  return users;
}

function mockFetchUsers({ page = 1, per_page = 6, INTERNAL_DB } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = INTERNAL_DB.length;
      const total_pages = Math.max(1, Math.ceil(total / per_page));
      const p = Math.max(1, Math.min(page, total_pages));
      const start = (p - 1) * per_page;
      const data = INTERNAL_DB.slice(start, start + per_page);
      resolve({
        page: p,
        per_page,
        total,
        total_pages,
        data
      });
    }, 200 + Math.random() * 200);
  });
}

export default function App() {
  const DEFAULT_PER_PAGE = 6;
  const TOTAL_PAGES = 4; // will generate 4*perPage users
  const [perPage, setPerPage] = useState(() => Number(localStorage.getItem('u_per_page')) || DEFAULT_PER_PAGE);
  const [INTERNAL_DB] = useState(() => generateUsers(TOTAL_PAGES * perPage, DEFAULT_PER_PAGE));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI controls
  const [query, setQuery] = useState(() => localStorage.getItem('u_query') || "");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('u_sortBy') || "");
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('u_sortDir') || "asc");
  const [filterType, setFilterType] = useState(() => localStorage.getItem('u_filterType') || "none");
  const [filterValue, setFilterValue] = useState(() => localStorage.getItem('u_filterValue') || "");
  const [view, setView] = useState(() => localStorage.getItem('u_view') || "table");
  const [compact, setCompact] = useState(() => localStorage.getItem('u_compact') === 'true');
  const [searchScope, setSearchScope] = useState(() => localStorage.getItem('u_searchScope') || 'page');
  const [status, setStatus] = useState("");

  useEffect(() => {
    localStorage.setItem('u_per_page', String(perPage));
    // regenerate totalPages based on INTERNAL_DB length
    const tp = Math.max(1, Math.ceil(INTERNAL_DB.length / perPage));
    setTotalPages(tp);
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadPage(p = 1) {
    setLoading(true);
    setStatus("Fetching users…");
    try {
      const res = await mockFetchUsers({ page: p, per_page: perPage, INTERNAL_DB });
      setPage(res.page);
      setTotalPages(res.total_pages);
      setUsers(res.data.slice());
      setStatus("Loaded");
    } catch (err) {
      setStatus("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
      saveState();
    }
  }

  async function fetchAllUsers() {
    setLoading(true);
    setStatus("Fetching all pages…");
    try {
      const all = [];
      const per = perPage;
      const totalPagesLocal = Math.max(1, Math.ceil(INTERNAL_DB.length / per));
      for (let p = 1; p <= totalPagesLocal; p++) {
        // eslint-disable-next-line no-await-in-loop
        const res = await mockFetchUsers({ page: p, per_page: per, INTERNAL_DB });
        all.push(...res.data);
      }
      setStatus("All pages loaded");
      return all;
    } catch (err) {
      setStatus("Error fetching all pages");
      return [];
    } finally {
      setLoading(false);
    }
  }

  function saveState() {
    localStorage.setItem('u_query', query);
    localStorage.setItem('u_sortBy', sortBy);
    localStorage.setItem('u_sortDir', sortDir);
    localStorage.setItem('u_filterType', filterType);
    localStorage.setItem('u_filterValue', filterValue);
    localStorage.setItem('u_view', view);
    localStorage.setItem('u_per_page', String(perPage));
    localStorage.setItem('u_compact', String(compact));
    localStorage.setItem('u_searchScope', searchScope);
  }

  function processList(list) {
    let out = list.slice();
    const q = (query || '').trim().toLowerCase();
    if (q) {
      out = out.filter(u => {
        const name = `${u.first_name} ${u.last_name}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    if (filterType === 'domain' && filterValue.trim()) {
      const domain = filterValue.trim().toLowerCase();
      out = out.filter(u => (u.email || '').toLowerCase().endsWith('@' + domain));
    } else if (filterType === 'firstLetter' && filterValue.trim()) {
      const ch = filterValue.trim()[0].toLowerCase();
      out = out.filter(u => (u.first_name || '').toLowerCase().startsWith(ch));
    }
    const sortKey = sortBy || localStorage.getItem('u_sortFallback') || 'first_name';
    if (sortKey) {
      out.sort((a,b) => {
        const A = (a[sortKey] || '').toLowerCase();
        const B = (b[sortKey] || '').toLowerCase();
        if (A < B) return sortDir === 'asc' ? -1 : 1;
        if (A > B) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return out;
  }

  const displayed = useMemo(() => {
    if (searchScope === 'global') {
      // merge all pages
      const all = INTERNAL_DB.slice();
      return processList(all);
    }
    return processList(users);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, query, filterType, filterValue, sortBy, sortDir, view, searchScope, perPage]);

  function toggleSort(key) {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
    saveState();
  }

  function toggleCompact() {
    setCompact(!compact);
    localStorage.setItem('u_compact', String(!compact));
  }

  function resetAll() {
    localStorage.clear();
    window.location.reload();
  }

  function viewProfile(id) {
    const u = INTERNAL_DB.find(x => x.id === id);
    if (!u) return alert('User not found');
    alert(`${u.first_name} ${u.last_name}\n\nEmail: ${u.email}\nID: ${u.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 border-b">
          <div>
            <h1 className="text-2xl font-semibold">User Directory</h1>
            <p className="text-sm text-slate-500 mt-1">Mock multi-page API, search, sort, filters, view toggle.</p>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={document.body.classList.contains('dark')} onChange={(e)=>{ const on=e.target.checked; localStorage.setItem('u_dark', on); document.body.classList.toggle('dark', on); }} className="h-4 w-4 rounded border-slate-300" />
              Dark mode
            </label>
            <button onClick={resetAll} className="ml-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm">Reset</button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input value={query} onChange={(e)=>{ setQuery(e.target.value); localStorage.setItem('u_query', e.target.value); }} type="search" placeholder="Search by name or email..." className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-slate-600">Sort:</label>
              <button onClick={()=>toggleSort('first_name')} className={"px-3 py-2 border rounded-md text-sm " + (sortBy==='first_name' ? 'bg-sky-600 text-white' : '')}>First name</button>
              <button onClick={()=>toggleSort('email')} className={"px-3 py-2 border rounded-md text-sm " + (sortBy==='email' ? 'bg-sky-600 text-white' : '')}>Email</button>
              <span className="text-xs text-slate-500 ml-2">{sortBy ? (sortDir==='asc' ? '↑ asc' : '↓ desc') : ''}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <label className="text-sm text-slate-600 mr-2">View:</label>
              <button onClick={()=>setView('table')} className="px-3 py-2 border rounded-md text-sm">Table</button>
              <button onClick={()=>setView('card')} className="px-3 py-2 border rounded-md text-sm">Card</button>
              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-slate-600">Per page</label>
                <select value={perPage} onChange={(e)=>{ setPerPage(Number(e.target.value)); }} className="px-2 py-1 border rounded-md text-sm">
                  <option value="6">6</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex gap-2 items-center">
              <select value={filterType} onChange={(e)=>{ setFilterType(e.target.value); localStorage.setItem('u_filterType', e.target.value); }} className="px-2 py-2 border rounded-md">
                <option value="none">No filter</option>
                <option value="domain">Email domain</option>
                <option value="firstLetter">First letter</option>
              </select>
              <input value={filterValue} onChange={(e)=>{ setFilterValue(e.target.value); localStorage.setItem('u_filterValue', e.target.value); }} placeholder="e.g. gmail.com or A" className="px-3 py-2 border rounded-md w-full" />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Search scope:</label>
              <select value={searchScope} onChange={(e)=>{ setSearchScope(e.target.value); localStorage.setItem('u_searchScope', e.target.value); }} className="px-2 py-2 border rounded-md">
                <option value="page">Current page only</option>
                <option value="global">Global (all pages)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Sort fallback:</label>
              <select onChange={(e)=>{ localStorage.setItem('u_sortFallback', e.target.value); }} className="px-2 py-2 border rounded-md">
                <option value="first_name">First name</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <div className="text-sm text-slate-500">{status}</div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">Showing <span className="font-medium">{displayed.length}</span> users</div>
            <div className="flex items-center gap-2">
              <button onClick={toggleCompact} className="px-3 py-1 border rounded-md text-sm">Toggle compact</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {view === 'table' ? (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {displayed.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-600">No users found.</td></tr>
                  ) : displayed.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><img className="avatar" src={u.avatar} alt={u.first_name} /></td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-slate-500">ID: {u.id}</div>
                      </td>
                      <td className="px-4 py-3 align-top"><a className="text-sky-600" href={`mailto:${u.email}`}>{u.email}</a></td>
                      <td className="px-4 py-3 align-top"><button onClick={()=>viewProfile(u.id)} className="px-2 py-1 text-sm rounded border">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.length === 0 ? <div className="col-span-full p-6 text-center text-slate-600">No users found.</div> : displayed.map(u => (
                  <div key={u.id} className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <img className="avatar" src={u.avatar} alt={u.first_name} />
                    <div className="flex-1">
                      <div className="font-medium">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                    <div><button onClick={()=>viewProfile(u.id)} className="px-3 py-2 border rounded-md text-sm">View</button></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={()=>loadPage(1)} className="px-3 py-1 rounded-md border">First</button>
              <button onClick={()=>{ if(page>1) loadPage(page-1); }} className="px-3 py-1 rounded-md border">Prev</button>
              <div className="px-3 py-1">Page <strong>{page}</strong> of <strong>{totalPages}</strong></div>
              <button onClick={()=>{ if(page<totalPages) loadPage(page+1); }} className="px-3 py-1 rounded-md border">Next</button>
              <button onClick={()=>loadPage(totalPages)} className="px-3 py-1 rounded-md border">Last</button>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex gap-1 flex-wrap">
                {Array.from({length: totalPages}, (_,i)=>i+1).map(p => (
                  <button key={p} onClick={()=>loadPage(p)} className={"px-2 py-1 rounded " + (p===page ? 'bg-sky-600 text-white' : 'border')}>{p}</button>
                ))}
              </div>
              <div className="text-sm text-slate-500 ml-2">| Toggle search: use the search box</div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(255,255,255,0.6)'}}>
          <div className="text-center">
            <div className="spinner mx-auto"></div>
            <div className="text-sm text-slate-600 mt-2">Loading...</div>
          </div>
        </div>
      )}
    </div>
  );
}
