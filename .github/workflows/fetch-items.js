// Safer/resilient fetch + accessibility + timeout + no innerHTML XSS
document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetch-btn");
  const itemList = document.getElementById("item-list");

  if (!fetchBtn || !itemList) {
    // Elements missing — nothing to do
    return;
  }

  const API_URL = "/api/data";
  const TIMEOUT_MS = 10000; // abort if request takes longer than this

  fetchBtn.addEventListener("click", () => {
    fetchItems();
  });

  async function fetchItems() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    toggleLoading(true);

    try {
      clearList();
      setStatusMessage("Loading items...");

      const response = await fetch(API_URL, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Defensive JSON parse
      const data = await response.json().catch(() => {
        throw new Error("Invalid JSON received from server");
      });

      const items = Array.isArray(data?.items) ? data.items : [];

      clearList();

      if (items.length === 0) {
        setStatusMessage("No items found.");
        return;
      }

      renderItems(items);

    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage(
        error.name === "AbortError" ? "Request timed out." : "Failed to load items."
      );
    } finally {
      clearTimeout(timeoutId);
      toggleLoading(false);
    }
  }

  // Helpers (use textContent to avoid XSS from server data)
  function clearList() {
    // remove all children safely
    while (itemList.firstChild) {
      itemList.removeChild(itemList.firstChild);
    }
  }

  function renderItems(items) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const li = document.createElement("li");
      // If item can be an object, convert safely to string
      li.textContent = typeof item === "string" ? item : JSON.stringify(item);
      fragment.appendChild(li);
    });
    itemList.appendChild(fragment);
  }

  function setStatusMessage(msg) {
    clearList();
    const li = document.createElement("li");
    li.textContent = msg;
    itemList.appendChild(li);
  }

  function setErrorMessage(msg) {
    clearList();
    const li = document.createElement("li");
    li.textContent = msg;
    li.style.color = "red";
    itemList.appendChild(li);
  }

  function toggleLoading(isLoading) {
    fetchBtn.disabled = isLoading;
    fetchBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
});