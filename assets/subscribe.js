/* Registration form on /subscribe.html.
 *
 * Posts to MailerLite's embedded-form endpoint. Two IDs are needed and they are
 * the only things to change here — both are in the embed snippet MailerLite
 * shows when a form is created (Forms -> Embedded form -> the action URL
 * .../jsonp/<ACCOUNT_ID>/forms/<FORM_ID>/subscribe).
 *
 * Until they are filled in, the form does not pretend to work: the button is
 * disabled and the page offers the email route instead. A failed request is
 * reported as a failure, never as a success, because a reader who thinks they
 * registered and did not is worse off than one who is told to send an email.
 *
 * Custom fields to create in MailerLite before going live (Subscribers ->
 * Fields), so the values arrive with a name rather than being dropped:
 *   role        text
 *   interests   text
 *   came_for    text
 * name and company are built in and need no setup.
 */
(function () {
  "use strict";

  var ACCOUNT_ID = "PASTE_MAILERLITE_ACCOUNT_ID";
  var FORM_ID = "PASTE_MAILERLITE_FORM_ID";

  var CONTACT = "grantchen@heliovulcan.com.au";
  var form = document.getElementById("reg-form");
  if (!form) return;

  var msg = document.getElementById("reg-msg");
  var button = form.querySelector('button[type="submit"]');
  var configured = ACCOUNT_ID.indexOf("PASTE_") !== 0 && FORM_ID.indexOf("PASTE_") !== 0;

  function say(text, state) {
    msg.innerHTML = text;
    msg.className = "reg__msg" + (state ? " is-" + state : "");
    msg.hidden = false;
  }

  /* Which file sent them here. The download points pass ?file=<name>, so the
     subscriber record shows what each person came for. */
  var cameFor = "";
  try {
    cameFor = new URLSearchParams(window.location.search).get("file") || "";
  } catch (e) { /* older browser: the field is simply left empty */ }
  cameFor = cameFor.replace(/[^A-Za-z0-9._ -]/g, "").slice(0, 80);
  if (cameFor) {
    var note = document.getElementById("reg-for");
    if (note) {
      note.textContent = "You came here for " + cameFor + ". It is sent with the confirmation email.";
      note.hidden = false;
    }
    var hidden = form.querySelector('input[name="came_for"]');
    if (hidden) hidden.value = cameFor;
  }

  if (!configured) {
    if (button) button.disabled = true;
    say("This form is not connected to its mailing list yet. To register in the meantime, email " +
        '<a href="mailto:' + CONTACT + '?subject=Register%20for%20data%20access">' + CONTACT +
        "</a> with your name and organisation, and we will add you and send the files.", "bad");
    return;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    /* A bot filling every field, including the one no person can see. */
    var trap = form.querySelector('input[name="website_url"]');
    if (trap && trap.value) return;

    var email = form.elements.email.value.trim();
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
      say("That email address does not look complete. Please check it and submit again.", "bad");
      form.elements.email.focus();
      return;
    }
    if (!form.elements.consent.checked) {
      say("Please confirm you are happy to receive the update notices before registering.", "bad");
      return;
    }

    var interests = [];
    Array.prototype.forEach.call(form.querySelectorAll('input[name="interests"]:checked'),
      function (el) { interests.push(el.value); });

    var body = new FormData();
    body.append("fields[email]", email);
    body.append("fields[name]", form.elements.name.value.trim());
    body.append("fields[company]", form.elements.company.value.trim());
    body.append("fields[role]", form.elements.role.value.trim());
    body.append("fields[interests]", interests.join(", "));
    body.append("fields[came_for]", cameFor);
    body.append("ml-submit", "1");
    body.append("anticsrf", "true");

    button.disabled = true;
    say("Sending…");

    fetch("https://assets.mailerlite.com/jsonp/" + ACCOUNT_ID + "/forms/" + FORM_ID + "/subscribe",
          { method: "POST", body: body })
      .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
      .then(function (data) {
        if (!data || data.success !== true) throw new Error("rejected");
        form.hidden = true;
        say("Registered. A confirmation email is on its way — open it to confirm the address, and " +
            "the files and the update notices follow. If it does not arrive within a few minutes, " +
            "check the spam folder, then email " +
            '<a href="mailto:' + CONTACT + '">' + CONTACT + "</a>.", "ok");
      })
      .catch(function () {
        button.disabled = false;
        say("That did not go through, so you are not registered. Please try again, or email " +
            '<a href="mailto:' + CONTACT + '?subject=Register%20for%20data%20access">' + CONTACT +
            "</a> with your name and organisation and we will add you by hand.", "bad");
      });
  });
})();
