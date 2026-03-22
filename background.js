function updateBadgeAndIcon() {
    chrome.storage.local.get('followups', (result) => {
      const items = result.followups || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const overdue = items.filter(item => {
        if (item.done) return false;
        const due = new Date(item.due);
        due.setHours(0, 0, 0, 0);
        return due < today;
      });
  
      const dueToday = items.filter(item => {
        if (item.done) return false;
        const due = new Date(item.due);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime();
      });
  
      const pending = items.filter(i => !i.done).length;
  
      if (overdue.length > 0) {
        // Red icon + red badge
        chrome.action.setIcon({
          path: {
            "16": "icons/icon16_red.png",
            "48": "icons/icon48_red.png",
            "128": "icons/icon128_red.png"
          }
        });
        chrome.action.setBadgeText({ text: String(overdue.length) });
        chrome.action.setBadgeBackgroundColor({ color: '#E8402A' });
  
      } else if (dueToday.length > 0) {
        // Yellow icon + amber badge
        chrome.action.setIcon({
          path: {
            "16": "icons/icon16_yellow.png",
            "48": "icons/icon48_yellow.png",
            "128": "icons/icon128_yellow.png"
          }
        });
        chrome.action.setBadgeText({ text: String(dueToday.length) });
        chrome.action.setBadgeBackgroundColor({ color: '#D97706' });
  
      } else {
        // Default dark icon
        chrome.action.setIcon({
          path: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
          }
        });
        if (pending > 0) {
          chrome.action.setBadgeText({ text: String(pending) });
          chrome.action.setBadgeBackgroundColor({ color: '#2563EB' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      }
    });
  }
  
  chrome.storage.onChanged.addListener(updateBadgeAndIcon);
  chrome.runtime.onInstalled.addListener(updateBadgeAndIcon);
  chrome.runtime.onStartup.addListener(updateBadgeAndIcon);