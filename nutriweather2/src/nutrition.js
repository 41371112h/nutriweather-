export function calcTdee({ gender, age, height, weight, goal }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);

  let bmr =
    gender === "女" || gender === "female"
      ? 10 * w + 6.25 * h - 5 * a - 161
      : 10 * w + 6.25 * h - 5 * a + 5;

  const activity = 1.4;
  let tdee = bmr * activity;

  if (goal === "減脂") tdee *= 0.85;
  else if (goal === "增肌") tdee *= 1.1;

  return Math.round(tdee);
}

export function splitMealsCalories(tdee) {
  return {
    breakfast: Math.round(tdee * 0.3),
    lunch: Math.round(tdee * 0.35),
    dinner: Math.round(tdee * 0.35),
  };
}
