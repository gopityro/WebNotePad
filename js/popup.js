$(function() {
    var notesData;

    $("#searchnotes").on("input", function () {
        const searchText = $(this).val().toLowerCase();
        filterAndRenderNotes(searchText);
    });

    function filterAndRenderNotes(searchText = "") {
    chrome.storage.sync.get("notesdata", function(data) {
        if (void 0 !== data.notesdata) {
            notesData = data.notesdata;
            var htmlContent = "";

            // Escape function to safely escape HTML chars
            function escapeHtml(text) {
                return text.replace(/&/g, "&amp;")
                           .replace(/</g, "&lt;")
                           .replace(/>/g, "&gt;")
                           .replace(/"/g, "&quot;")
                           .replace(/'/g, "&#039;");
            }

            $.each(data.notesdata, function(index, note) {
                // Check if note matches filter
                if (
                    note.content.toLowerCase().includes(searchText) ||
                    note.date.toLowerCase().includes(searchText)
                ) {
                    // Escape content first
                    let safeContent = escapeHtml(note.content);

                    if (searchText) {
                        // Create RegExp to replace all matches (case-insensitive)
                        const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                        // Replace matched text with <mark>wrapped text</mark>
                        safeContent = safeContent.replace(regex, '<mark>$1</mark>');
                    }

                    htmlContent += '<div class="note-box">';
                    htmlContent += '<small><i class="blue-grey-text lighten-5"><u>' + note.date + "</u></i></small><div id='mainnote" + note.id + "'>";
                    htmlContent += safeContent;
                    htmlContent += '</div><br><label class="right noteitem" id="' + note.id + '"><img src="img/rubbish-bin.png" /></label> <label class="right noteitemcopy" id="' + note.id + '"><img src="img/copy.png" /></label><br></div>';
                }
            });
            $("div.notescontent").html(htmlContent);
        }
    });

    // Load cached note (optional, unchanged)
    chrome.storage.local.get("cachedNote", function(data) {
        if (data.cachedNote) {
            $("#notestxt").val(data.cachedNote);
        }
    });
}

    function loadNotes() {
        filterAndRenderNotes();
    }

    $("#notestxt").on("input", function() {
        var cachedNoteContent = $(this).val();
        chrome.storage.local.set({ cachedNote: cachedNoteContent });
    });

    $("#savenotes").on("click", function() {
        var newNoteContent = $("#notestxt").val();
        if (!(newNoteContent.length <= 0)) {
            var currentDate = new Date;
            var formattedDate = currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" + currentDate.getFullYear();
            chrome.storage.sync.get("notesdata", function(data) {
                var notesArray = data.notesdata || [];
                var maxId = notesArray.length > 0 ? Math.max(...notesArray.map(note => note.id)) : 0;
                var newNote = {
                    id: maxId + 1,
                    content: newNoteContent,
                    date: formattedDate
                };
                notesArray.push(newNote);
                chrome.storage.sync.set({
                    notesdata: notesArray
                }, function() {
                    //since, notes has been save, first clear the catched and then update(loadNotes())
                    // saved list of notes.
                    chrome.storage.local.remove("cachedNote");
                    loadNotes();
                });
            });
            $("#notestxt").val("");
        }
    });

    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function() {
        loadNotes();
    });

    $(document).on("click", ".noteitem", function() {
        if (void 0 !== notesData) {
            var noteId = parseInt(this.id);
            var filteredNotes = notesData.filter(function(note) {
                return note.id !== noteId;
            });
            var confirmed = confirm("Are you sure you want to delete this note?");
            if (confirmed) {
                chrome.storage.sync.set({
                    notesdata: filteredNotes
                }, function() {
                    loadNotes();
                });
            }
        }
    });

    $(document).on("click", ".noteitemcopy", function() {
        var noteId = parseInt(this.id);
        var selectedNote = notesData.find(function(note) {
            return note.id === noteId;
        });
        if (selectedNote) {
            var $copyIcon = $(this).find('img');
            var originalSrc = $copyIcon.attr('src');

            navigator.clipboard.writeText(selectedNote.content)
                .then(function() {
                    $copyIcon.attr('src', 'img/copied.png');
                })
                .catch(function(error) {
                    console.error("Failed to copy note content: ", error);
                }).finally(function() {
                    setTimeout(function() {
                        $copyIcon.attr('src', originalSrc);
                    }, 300);
                });
        }
    });
});
