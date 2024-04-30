chrome.runtime.onInstalled.addListener(() => {
  // Context menus require declarative registration now
  chrome.contextMenus.create({
    title: "Add to WebNotes",
    contexts: ["selection"],
    id: "id_addnotes"
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "id_addnotes") {
    const selectedText = info.selectionText;
    const today = new Date().toLocaleDateString(); // Uses modern date formatting

    // Retrieve notes data from storage to determine the next available ID
    chrome.storage.sync.get('notesdata', (result) => {
      let notesData = result.notesdata || []; // Initialize with empty array if not found

      // Find the maximum ID among existing notes
      const maxId = notesData.length > 0 ? Math.max(...notesData.map(note => note.id)) : 0;

      const newNote = {
        id: maxId + 1,
        content: selectedText,
        date: today
      };

      // Add the new note to the notes data array
      notesData.push(newNote);

      // Save the updated notes data array to storage
      chrome.storage.sync.set({ notesdata: notesData });
    });
  }
});
