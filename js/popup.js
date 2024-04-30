$(function() {
    var notesData;

    function loadNotes() {
        chrome.storage.sync.get("notesdata", function(data) {
            if (void 0 !== data.notesdata) {
                notesData = data.notesdata;
                var htmlContent = "";
                $.each(data.notesdata, function(index, note) {
                    htmlContent += '<div class="note-box">';
                    htmlContent += '<small><i class="blue-grey-text lighten-5"><u>' + note.date + "</u></i></small><div id='mainnote" + note.id + "'>";
                    htmlContent += note.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    htmlContent += '</div><br><label class="right noteitem" id="' + note.id + '"><img src="img/rubbish-bin.png" /></label> <label class="right noteitemcopy" id="' + note.id + '"><img src="img/copy.png" /></label><br></div>';
                });
                $("div.notescontent").html(htmlContent);
            }
        });
    }

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
