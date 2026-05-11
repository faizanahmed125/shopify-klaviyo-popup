<script>
  const KL_PUBLIC_KEY    = 'WavnW8';   
  const KL_LIST_LEADS    = 'SR7GM5';   
  const KL_LIST_CHILDREN = 'XMPjtp';

  let firstFormCompleted = false;
  let numChildren = 0;

  async function klSubscribeToList(email, listId, phone = null, extraProps = {}) {
    // Build the profile attributes object
    const profileAttrs = {
      email: email,
      ...extraProps  // merge any custom properties directly onto profile
    };

    if (phone && phone.length > 3) {
      profileAttrs.phone_number = phone;
    }

    const payload = {
      data: {
        type: 'subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: profileAttrs
            }
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: listId
            }
          }
        }
      }
    };

    const response = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${KL_PUBLIC_KEY}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'revision': '2024-02-15'
        },
        body: JSON.stringify(payload)
      }
    );

    // 202 Accepted = success for this endpoint
    if (!response.ok && response.status !== 202) {
      const errBody = await response.text();
      throw new Error(`Klaviyo API error ${response.status}: ${errBody}`);
    }

    return response;
  }

  async function klUpdateProfile(email, properties = {}, phone = null) {
    const profileAttrs = {
      email: email,
      properties: properties
    };

    if (phone && phone.length > 3) {
      profileAttrs.phone_number = phone;
    }

    const payload = {
      data: {
        type: 'profile',
        attributes: profileAttrs
      }
    };

    const response = await fetch(
      `https://a.klaviyo.com/client/profiles/?company_id=${KL_PUBLIC_KEY}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'revision': '2024-02-15'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok && response.status !== 200 && response.status !== 201 && response.status !== 202) {
      const errBody = await response.text();
      throw new Error(`Klaviyo profile update error ${response.status}: ${errBody}`);
    }

    return response;
  }


  /* POPUP 1 — WELCOME FORM */

  async function submitWelcome() {
    const email = document.getElementById('kl-email-1').value.trim();
    const phone = document.getElementById('kl-phone-1').value.trim();
    const errEl = document.getElementById('kl-err-1');
    const btn   = document.getElementById('kl-btn-welcome');

    // Basic validation
    if (!email || !email.includes('@')) {
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }
    errEl.textContent = '';
    btn.textContent = 'Saving…';
    btn.disabled = true;

    try {
      // 1️⃣ Subscribe to the main leads list (with email + phone consent)
      await klSubscribeToList(email, KL_LIST_LEADS, phone);

      // 2️⃣ Enrich profile with source metadata
      await klUpdateProfile(
        email,
        {
          signup_source: 'Homepage Welcome Popup',
          signup_date: new Date().toISOString().split('T')[0]  // YYYY-MM-DD
        },
        phone
      );

      console.log('[Klaviyo] Welcome form submitted successfully.');

      // Show thank-you state
      document.getElementById('kl-welcome-form').style.display  = 'none';
      document.getElementById('kl-welcome-thanks').style.display = 'block';
      firstFormCompleted = true;

    } catch (err) {
      console.error('[Klaviyo] Welcome form error:', err);
      errEl.textContent = 'Something went wrong. Please try again.';
      btn.textContent = 'Subscribe';
      btn.disabled = false;
    }
  }

  function closeWelcome() {
    document.getElementById('kl-welcome-overlay').classList.remove('active');

    // Only show the children question if the user actually submitted the form
    if (firstFormCompleted) {
      setTimeout(function () {
        document.getElementById('kl-children-bar').classList.add('active');
      }, 350);
    }
  }

  /* DROPDOWN BAR — CHILDREN QUESTION */

  function handleChildrenAnswer(val) { 
    if (!val) return;

    if (val === 'no') {
      closeBar();
      return;
    }

    // val is "1", "2", "3", or "4"
    numChildren = parseInt(val, 10);
    closeBar();
    buildBirthdayFields(numChildren);

    // Pre-fill email from popup 1
    const email1 = document.getElementById('kl-email-1').value.trim();
    if (email1) document.getElementById('kl-email-2').value = email1;

    setTimeout(function () {
      document.getElementById('kl-birthday-overlay').classList.add('active');
    }, 250);
  }

  function closeBar() {
    document.getElementById('kl-children-bar').classList.remove('active');
    // Reset the select so it doesn't re-trigger if shown again
    document.getElementById('kl-children-answer').value = '';
  }


  /* POPUP 2 — BIRTHDAY FORM */

  function buildBirthdayFields(n) {
    const container = document.getElementById('kl-birthday-fields');
    container.innerHTML = '';

    for (let i = 1; i <= n; i++) {
      const wrap  = document.createElement('div');

      const label = document.createElement('label');
      label.setAttribute('for', 'kl-bday-' + i);
      label.textContent = 'Child ' + i + ' — Date of Birth';

      const input = document.createElement('input');
      input.type = 'date';
      input.id   = 'kl-bday-' + i;
      // Prevent future dates
      input.max  = new Date().toISOString().split('T')[0];

      wrap.appendChild(label);
      wrap.appendChild(input);
      container.appendChild(wrap);
    }
  }

  async function submitBirthdays() {
    const email = document.getElementById('kl-email-2').value.trim();
    const errEl = document.getElementById('kl-err-2');
    const btn   = document.getElementById('kl-btn-bday');

    if (!email || !email.includes('@')) {
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }
    errEl.textContent = '';
    btn.textContent = 'Saving…';
    btn.disabled = true;

    // Build custom properties — one field per child
    const properties = {
      number_of_children: numChildren
    };
    for (let i = 1; i <= numChildren; i++) {
      const val = document.getElementById('kl-bday-' + i)?.value;
      if (val) properties['child_' + i + '_birthday'] = val;
    }

    try {
      // 1️⃣ Add to the "Has Children" list
      await klSubscribeToList(email, KL_LIST_CHILDREN);

      // 2️⃣ Save birthday details on the profile
      await klUpdateProfile(email, properties);

      console.log('[Klaviyo] Birthday details saved:', properties);

      document.getElementById('kl-birthday-form').style.display  = 'none';
      document.getElementById('kl-birthday-thanks').style.display = 'block';

    } catch (err) {
      console.error('[Klaviyo] Birthday form error:', err);
      errEl.textContent = 'Error saving details. Please try again.';
      btn.textContent = 'Save Birthday Details';
      btn.disabled = false;
    }
  }

  function closeBirthdayPopup() {
    document.getElementById('kl-birthday-overlay').classList.remove('active');
  }
</script>

{% endif %}
