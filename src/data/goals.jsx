import { HomeIcon, Landmark, Coins, PiggyBank, GraduationCap } from "lucide-react";

export const GOALS = [
  { key: "house",      name: "Buy a home",           icon: HomeIcon,       blurb: "Save a down payment, tax-efficiently." },
  { key: "retirement", name: "Retire comfortably",   icon: Landmark,       blurb: "Build long-term, tax-advantaged wealth." },
  { key: "education",  name: "Kids' education",      icon: GraduationCap,  blurb: "RESP savings with the government's 20% grant — model each child separately." },
  { key: "number",     name: "Hit a target number",  icon: Coins,          blurb: "Grow to a specific invested amount." },
  { key: "save",       name: "Save for something",   icon: PiggyBank,      blurb: "One or more specific goals — a car, a wedding, a trip." },
];
