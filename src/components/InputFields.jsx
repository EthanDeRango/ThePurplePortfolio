import { ChevronDown } from "lucide-react";

export function NumberField({ label, help, value, onChange, placeholder, suffix, id, error }) {
  return (
    <div className="pp-field">
      <label className="pp-label2" htmlFor={id}>{label}</label>
      <div className={"pp-input-wrap" + (error ? " err" : "")}>
        <input
          id={id}
          className="pp-input"
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {suffix && <span className="pp-adorn r">{suffix}</span>}
      </div>
      {error && <div className="pp-error">{error}</div>}
      {help && !error && <div className="pp-help">{help}</div>}
    </div>
  );
}

export function CurrencyField({ label, help, value, onChange, placeholder, id, error }) {
  const display = value === "" || value == null ? "" : Number(value).toLocaleString("en-CA");
  return (
    <div className="pp-field">
      <label className="pp-label2" htmlFor={id}>{label}</label>
      <div className={"pp-input-wrap" + (error ? " err" : "")}>
        <span className="pp-adorn">$</span>
        <input
          id={id}
          className="pp-input"
          inputMode="numeric"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            onChange(raw === "" ? "" : Number(raw));
          }}
        />
      </div>
      {error && <div className="pp-error">{error}</div>}
      {help && !error && <div className="pp-help">{help}</div>}
    </div>
  );
}

export function SelectField({ label, help, value, onChange, options, id }) {
  return (
    <div className="pp-field">
      <label className="pp-label2" htmlFor={id}>{label}</label>
      <select id={id} className="pp-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {help && <div className="pp-help">{help}</div>}
    </div>
  );
}

export function Accordion({ title, sub, open, onToggle, children }) {
  return (
    <div className="pp-acc">
      <button className="pp-acc-head" onClick={onToggle} aria-expanded={open}>
        <div>
          <h4>{title}</h4>
          {sub && <div className="sub">{sub}</div>}
        </div>
        <ChevronDown size={20} className={"pp-chev" + (open ? " open" : "")} />
      </button>
      {open && <div className="pp-acc-body">{children}</div>}
    </div>
  );
}
