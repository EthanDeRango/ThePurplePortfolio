import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Budget from './Budget.jsx';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

function renderBudget(plan = {}, setPlan = vi.fn()) {
  return render(
    <MemoryRouter>
      <Budget plan={plan} setPlan={setPlan} />
    </MemoryRouter>
  );
}

const PLAN = { income: 60000, livingExpenses: 2000, monthly: 800, age: 28, birthYear: 1998 };

describe('Budget — render', () => {
  it('mounts and shows the grid, all 12 months, and the export button', () => {
    renderBudget(PLAN);
    expect(screen.getByRole('heading', { name: /month-by-month budget/i })).toBeInTheDocument();
    // Each section (Income/Expenses/Investments) is now its own scrollable table with its own
    // column header, so month labels legitimately appear more than once.
    for (const m of ['Jan', 'Jun', 'Dec']) expect(screen.getAllByText(m).length).toBeGreaterThanOrEqual(1);
    // "Net cash flow" appears in both the summary bar and the grid's final row
    expect(screen.getAllByText('Net cash flow').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: /Export to Excel/i })).toBeInTheDocument();
  });

  it('loads Planner data into the sync banner and seeds the primary income row', () => {
    renderBudget(PLAN);
    expect(screen.getByText(/Planner data loaded/i)).toBeInTheDocument();
    // Young-professional primary income row seeded to 5,000/mo (60,000 / 12)
    const janSalary = screen.getByLabelText('Salary / Wages Jan');
    expect(janSalary).toHaveValue('5,000');
  });
});

describe('Budget — interaction', () => {
  it('recomputes the annual total when a cell changes', () => {
    renderBudget(PLAN);
    const cell = screen.getByLabelText('Side Income / Freelance Mar');
    fireEvent.change(cell, { target: { value: '1000' } });
    // The summary "Annual income" should now include the new 1,000 on top of the seeded 60,000
    const incomeStat = screen.getByText('Annual income').closest('.pp-bud-stat');
    expect(within(incomeStat).getByText('$61,000')).toBeInTheDocument();
  });

  it('confirms a life-stage swap and relabels rows while keeping amounts', () => {
    renderBudget(PLAN);
    fireEvent.change(screen.getByLabelText('Life stage'), { target: { value: 'retirement' } });
    expect(screen.getByText(/Switching to/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Use Retirement labels/i }));
    // Retirement's first income label is "CPP"; the seeded $5,000 stays on row 1.
    expect(screen.getByLabelText('CPP Jan')).toHaveValue('5,000');
  });

  it("can switch stage while keeping the user's own row labels", () => {
    renderBudget(PLAN);
    fireEvent.change(screen.getByLabelText('Life stage'), { target: { value: 'retirement' } });
    fireEvent.click(screen.getByRole('button', { name: /Keep my own rows/i }));
    // Labels stay as young-pro's; the seeded $5,000 stays on Salary / Wages.
    expect(screen.getByLabelText('Salary / Wages Jan')).toHaveValue('5,000');
  });

  it('keeps Refresh available after the sync banner is dismissed', () => {
    renderBudget(PLAN);
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(screen.getByRole('button', { name: /Refresh from Planner/i })).toBeInTheDocument();
  });

  it('shows expenses and investing as a share of income', () => {
    renderBudget(PLAN);
    // seeded: income 60k, expenses 24k (40%), invested 9.6k (16%)
    expect(screen.getByText('40% of income')).toBeInTheDocument();
    expect(screen.getByText('16% of income')).toBeInTheDocument();
  });

  it('adds a new budget year (rolled forward) and hides Planner sync there', () => {
    renderBudget(PLAN);
    // default year is the planner year, so Apply is available
    expect(screen.getByRole('button', { name: /Apply to my Planner/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add year/i }));
    // now on the next year: sync is gone, replaced by a note
    expect(screen.queryByRole('button', { name: /Apply to my Planner/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Planner sync is on your 2026 budget/i)).toBeInTheDocument();
    // the rolled-forward year keeps the seeded salary
    expect(screen.getByLabelText('Salary / Wages Jan')).toHaveValue('5,000');
  });

  it('pushes numbers back to the Planner only after an explicit confirm', () => {
    const setPlan = vi.fn();
    renderBudget(PLAN, setPlan);
    fireEvent.click(screen.getByRole('button', { name: /Apply to my Planner/i }));
    expect(setPlan).not.toHaveBeenCalled(); // confirm step first
    fireEvent.click(screen.getByRole('button', { name: /^Apply$/i }));
    expect(setPlan).toHaveBeenCalledTimes(1);
    // setPlan is called with an updater fn; apply it to confirm the patch shape.
    const patch = setPlan.mock.calls[0][0]({});
    expect(patch.income).toBe(60000);
    expect(patch.monthly).toBe(800);
    expect(patch.livingExpenses).toBe(2000);
  });

  it('adds a row to a section', () => {
    renderBudget(PLAN);
    const addButtons = screen.getAllByRole('button', { name: /Add row/i });
    fireEvent.click(addButtons[0]); // income section
    expect(screen.getByLabelText('New row Jan')).toBeInTheDocument();
  });

  it('fill-across copies a value through December', () => {
    renderBudget(PLAN);
    const jan = screen.getByLabelText('Side Income / Freelance Jan');
    fireEvent.change(jan, { target: { value: '1000' } });
    // The fill handle only appears once the cell has a value.
    const fillBtn = screen.getByRole('button', { name: /Fill 1,000 across the rest of Side Income/i });
    fireEvent.click(fillBtn);
    expect(screen.getByLabelText('Side Income / Freelance Dec')).toHaveValue('1,000');
    expect(screen.getByLabelText('Side Income / Freelance Jun')).toHaveValue('1,000');
  });
});
