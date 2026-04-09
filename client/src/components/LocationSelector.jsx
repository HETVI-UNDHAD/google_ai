import { STATES, getDistricts, getCities, getAreas } from '../indiaLocations';

const SELECT = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 focus:bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export default function LocationSelector({ value, onChange, required = true }) {
  // value = { state, district, city, area }
  const { state = '', district = '', city = '', area = '' } = value;

  const districts = getDistricts(state);
  const cities    = getCities(state, district);
  const areas     = getAreas(state, district, city);

  const set = (field, val) => {
    // Reset downstream fields when a parent changes
    if (field === 'state')    return onChange({ state: val, district: '', city: '', area: '' });
    if (field === 'district') return onChange({ ...value, district: val, city: '', area: '' });
    if (field === 'city')     return onChange({ ...value, city: val, area: '' });
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* State */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
          State {required && <span className="text-rose-500">*</span>}
        </label>
        <select value={state} onChange={e => set('state', e.target.value)} required={required} className={SELECT}>
          <option value="">— Select State —</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
          District {required && <span className="text-rose-500">*</span>}
        </label>
        <select value={district} onChange={e => set('district', e.target.value)} required={required}
          disabled={!state} className={SELECT}>
          <option value="">— Select District —</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
          City {required && <span className="text-rose-500">*</span>}
        </label>
        <select value={city} onChange={e => set('city', e.target.value)} required={required}
          disabled={!district} className={SELECT}>
          <option value="">— Select City —</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Area */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
          Area {required && <span className="text-rose-500">*</span>}
        </label>
        <select value={area} onChange={e => set('area', e.target.value)} required={required}
          disabled={!city} className={SELECT}>
          <option value="">— Select Area —</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </div>
  );
}
