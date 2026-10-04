import { UserAccount } from '../types/snackhack';

const STORAGE_CURRENT_USER_KEY = 'snackhack_current_user_id';

export function setCurrentUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  } catch {
    return null;
  }
}

export function getStoredUserRecipes(userId: string): { saved: string[]; recent: string[] } {
  try {
    const rawSaved = localStorage.getItem(`chefmate_saved_${userId}`);
    const rawRecent = localStorage.getItem(`chefmate_recent_${userId}`);
    return {
      saved: rawSaved ? JSON.parse(rawSaved) : [],
      recent: rawRecent ? JSON.parse(rawRecent) : [],
    };
  } catch {
    return { saved: [], recent: [] };
  }
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com)' };
  }
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  return { isValid: true };
}

export function toggleRecipeSave(
  currentUser: UserAccount | null,
  recipeId: string
): { updatedUser: UserAccount | null; isSaved: boolean } {
  const userId = currentUser ? currentUser.id : 'guest';
  const currentSaved = currentUser ? currentUser.savedRecipeIds : getStoredUserRecipes('guest').saved;
  const currentRecent = currentUser ? currentUser.recentRecipeIds : getStoredUserRecipes('guest').recent;

  const isAlreadySaved = currentSaved.includes(recipeId);
  const updatedSaved = isAlreadySaved
    ? currentSaved.filter((id) => id !== recipeId)
    : [recipeId, ...currentSaved];

  const updatedRecent = !isAlreadySaved
    ? [recipeId, ...currentRecent.filter((id) => id !== recipeId)].slice(0, 15)
    : currentRecent;

  try {
    localStorage.setItem(`chefmate_saved_${userId}`, JSON.stringify(updatedSaved));
    localStorage.setItem(`chefmate_recent_${userId}`, JSON.stringify(updatedRecent));
  } catch {
    // LocalStorage quota or access error
  }

  if (!currentUser) {
    return {
      updatedUser: null,
      isSaved: !isAlreadySaved,
    };
  }

  const updatedUser: UserAccount = {
    ...currentUser,
    savedRecipeIds: updatedSaved,
    recentRecipeIds: updatedRecent,
  };

  return { updatedUser, isSaved: !isAlreadySaved };
}

export function removeRecipeFromSaved(
  currentUser: UserAccount | null,
  recipeId: string
): UserAccount | null {
  const userId = currentUser ? currentUser.id : 'guest';
  const currentSaved = currentUser ? currentUser.savedRecipeIds : getStoredUserRecipes('guest').saved;
  const updatedSaved = currentSaved.filter((id) => id !== recipeId);

  try {
    localStorage.setItem(`chefmate_saved_${userId}`, JSON.stringify(updatedSaved));
  } catch {
    // LocalStorage quota or access error
  }

  if (!currentUser) return null;

  return {
    ...currentUser,
    savedRecipeIds: updatedSaved,
  };
}

export function addRecipeToRecent(
  currentUser: UserAccount | null,
  recipeId: string
): UserAccount | null {
  const userId = currentUser ? currentUser.id : 'guest';
  const currentRecent = currentUser ? currentUser.recentRecipeIds : getStoredUserRecipes('guest').recent;
  const filtered = currentRecent.filter((id) => id !== recipeId);
  const updatedRecent = [recipeId, ...filtered].slice(0, 15);

  try {
    localStorage.setItem(`chefmate_recent_${userId}`, JSON.stringify(updatedRecent));
  } catch {
    // LocalStorage quota or access error
  }

  if (!currentUser) return null;

  return {
    ...currentUser,
    recentRecipeIds: updatedRecent,
  };
}
