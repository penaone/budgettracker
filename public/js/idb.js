// declare db variable
let db;
const request = indexedDB.open("pwa_budget", 1);

// listener runs when version changes or first connected
request.onupgradeneeded = function (event) {
  const db = event.target.result;

  // create an object store (table) called 'budget_item', set it to have auto increment
  db.createObjectStore("budget_item", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadExpenses();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// save data will run in index.js
// opens transaction then accesses expenseObjectStore to save data on form submit
function saveData(data) {
  // open transaction
  const transaction = db.transaction(["budget_item"], "readwrite");

  // access object store
  const expenseObjectStore = transaction.objectStore("budget_item");

  expenseObjectStore.add(data);
}

function uploadExpenses() {
  const transaction = db.transaction(["budget_item"], "readwrite");
  const expenseObjectStore = transaction.objectStore("budget_item");
  const getAll = expenseObjectStore.getAll();

  getAll.onsuccess = function () {
    // if any new data in object store; sync with db
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["budget_item"], "readwrite");
          const expenseObjectStore = transaction.objectStore(["budget_item"]);
          expenseObjectStore.clear();
          alert("All expenses have beensubmitted");
        })
        .catch((err) => console.log(err));
    }
  };
}

window.addEventListener("online", uploadExpenses);