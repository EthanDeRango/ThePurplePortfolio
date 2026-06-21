import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import { PLAN_DEFAULTS } from '../data/constants.js';

afterEach(cleanup);

// Render the dashboard with a plan, no Auth/Supabase needed — just a router for useNavigate.
function renderDash(overrides = {}) {
  const plan = { ...PLAN_DEFAULTS, ...overrides };
  return render(
    <MemoryRouter>
      <Dashboard plan={plan} setPlan={vi.fn()} />
    </MemoryRouter>
  );
}

// A funded, non-home-buying retirement saver — enough data for a full action plan.
const FUNDED = {
  age: '40', income: '110000', province: 'ON', monthly: '1500',
  goals: ['retirement'], emergencyStatus: 'full', retAge: '65',
  bTfsa: '30000', bRrsp: '60000', openAccounts: ['tfsa', 'rrsp'],
};

describe('Dashboard — tab navigation', () => {
  it('opens the Action plan by default and hides "go deeper" sections', () => {
    renderDash(FUNDED);
    // the action-plan section heading is unique (the eyebrow text also appears in the guide)
    expect(screen.getByRole('heading', { name: /goes, in order/i })).toBeInTheDocument();
    // Contribution limits lives under its own tab — not shown until opened
    expect(screen.queryByText(/How much you can still put in each account/i)).not.toBeInTheDocument();
  });

  it('reveals a section when its tab is clicked', () => {
    renderDash(FUNDED);
    fireEvent.click(screen.getByRole('button', { name: /Contribution limits/i }));
    expect(screen.getByText(/How much you can still put in each account/i)).toBeInTheDocument();
  });
});

describe('Dashboard — RRSP room safety (#3)', () => {
  it('flags the RRSP step when a workplace pension exists and no NOA is entered', () => {
    renderDash({ ...FUNDED, bPensionDC: '80000', openAccounts: ['tfsa', 'rrsp', 'pension_dc'] });
    // the warning badge on the action-plan step
    expect(screen.getByText(/Check your NOA room/i)).toBeInTheDocument();
    // and the explanation about the pension adjustment
    expect(screen.getByText(/pension adjustment/i)).toBeInTheDocument();
  });

  it('does not flag the RRSP step when NOA room is provided', () => {
    renderDash({ ...FUNDED, bPensionDC: '80000', rrspLimitNOA: '15000', openAccounts: ['tfsa', 'rrsp', 'pension_dc'] });
    expect(screen.queryByText(/Check your NOA room/i)).not.toBeInTheDocument();
  });
});

describe('Dashboard — incorporated pay (#4)', () => {
  it('shows the salary/dividend split with no CPP/EI on dividends', () => {
    renderDash({ ...FUNDED, employmentType: 'incorporated', payMix: 'dividends', dividendType: 'noneligible', income: '120000' });
    fireEvent.click(screen.getByRole('button', { name: /Paycheque & tax/i }));
    expect(screen.getByText(/no CPP\/EI/i)).toBeInTheDocument();
  });
});

describe('Dashboard — life events timeline (#2)', () => {
  it('renders the "what changes over time" timeline when savings events exist', () => {
    renderDash({ ...FUNDED, lifeEvents: [{ id: '1', type: 'invest-more', amount: '1200', age: '50', label: 'Mortgage paid off' }] });
    expect(screen.getByText(/What changes over time/i)).toBeInTheDocument();
    expect(screen.getByText(/Mortgage paid off/i)).toBeInTheDocument();
  });

  it('does not render the timeline with no events', () => {
    renderDash(FUNDED);
    expect(screen.queryByText(/What changes over time/i)).not.toBeInTheDocument();
  });
});

describe('Dashboard — goal due dates', () => {
  it('shows the due month/year on a dated savings goal', () => {
    renderDash({
      ...FUNDED, goals: ['retirement', 'save'],
      customGoals: [{ name: "Maya's university", amount: '20000', date: '2032-09-01' }],
    });
    fireEvent.click(screen.getByRole('button', { name: /Goals & score/i }));
    expect(screen.getByText(/due Sep 2032/i)).toBeInTheDocument();
  });
});

describe('Dashboard — empty state', () => {
  it('shows the welcoming guide when there is no income or data', () => {
    renderDash({ age: '19', income: '', monthly: '', goals: ['retirement'] });
    expect(screen.getByText(/Just starting out/i)).toBeInTheDocument();
  });
});
