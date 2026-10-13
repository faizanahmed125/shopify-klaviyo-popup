<script>
  const KLAVIYO_CONFIG = {
    companyId: 'YOUR_PUBLIC_COMPANY_ID',
    leadsListId: 'YOUR_LEADS_LIST_ID',
    childrenListId: 'YOUR_CHILDREN_LIST_ID'
  };

  let firstFormCompleted = false;
  let numChildren = 0;

  function assertKlaviyoConfig() {
    const missingValue = Object.values(KLAVIYO_CONFIG).some(
      (value) => !value || value.startsWith('YOUR_')
    );

    if (missingValue) {
      throw new Error('Add your Klaviyo company and list IDs in KLAVIYO_CONFIG before using this popup.');
    }
  }

  async function klSubscribeToList(email, listId, phone = null, extraProps = {}) {
    assertKlaviyoConfig();

    const profileAttrs = {
      email,
      ...extraProps
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
      `https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_CONFIG.companyId}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          revision: '2024-02-15'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok && response.status !== 202) {
      const errBody = await response.text();
      throw new Error(`Klaviyo API error ${response.status}: ${errBody}`);
    }

    return response;
  }

  async function klUpdateProfile(email, properties = {}, phone = null) {
    assertKlaviyoConfig();

    const profileAttrs = {
      email,
      properties
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
      `https://a.klaviyo.com/client/profiles/?company_id=${KLAVIYO_CONFIG.companyId}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          revision: '2024-02-15'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok && ![200, 201, 202].includes(response.status)) {
      const errBody = await response.text();
      throw new Error(`Klaviyo profile update error ${response.status}: ${errBody}`);
    }

    return response;
  }

  async function submitWelcome() {
    const email = document.getElementById('kl-email-1').value.trim();
    const phone = document.getElementById('kl-phone-1').value.trim();
    const errEl = document.getElementById('kl-err-1');
    const btn = document.getElementById('kl-btn-welcome');

    if (!email || !email.includes('@')) {
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }

    errEl.textContent = '';
    btn.textContent = 'Saving…';
    btn.disabled = true;

    try {
      await klSubscribeToList(email, KLAVIYO_CONFIG.leadsListId, phone);
      await klUpdateProfile(
        email,
        {
          signup_source: 'Homepage Welcome Popup',
          signup_date: new Date().toISOString().split('T')[0]
        },
        phone
      );

      document.getElementById('kl-welcome-form').style.display = 'none';
      document.getElementById('kl-welcome-thanks').style.display = 'block';
      firstFormCompleted = true;
    } catch (error) {
      console.error('[Klaviyo] Welcome form error:', error);
      errEl.textContent = 'Something went wrong. Please try again.';
      btn.textContent = 'Subscribe';
      btn.disabled = false;
    }
  }

  function closeWelcome() {
    document.getElementById('kl-welcome-overlay').classList.remove('active');

    if (firstFormCompleted) {
      setTimeout(() => {
        document.getElementById('kl-children-bar').classList.add('active');
      }, 350);
    }
  }

  function handleChildrenAnswer(value) {
    if (!value) return;

    if (value === 'no') {
      closeBar();
      return;
    }

    numChildren = Number.parseInt(value, 10);
    closeBar();
    buildBirthdayFields(numChildren);

    const firstEmail = document.getElementById('kl-email-1').value.trim();
    if (firstEmail) {
      document.getElementById('kl-email-2').value = firstEmail;
    }

    setTimeout(() => {
      document.getElementById('kl-birthday-overlay').classList.add('active');
    }, 250);
  }

  function closeBar() {
    document.getElementById('kl-children-bar').classList.remove('active');
    document.getElementById('kl-children-answer').value = '';
  }

  function buildBirthdayFields(count) {
    const container = document.getElementById('kl-birthday-fields');
    container.innerHTML = '';

    for (let index = 1; index <= count; index += 1) {
      const wrapper = document.createElement('div');
      const label = document.createElement('label');
      const input = document.createElement('input');

      label.setAttribute('for', `kl-bday-${index}`);
      label.textContent = `Child ${index} — Date of Birth`;

      input.type = 'date';
      input.id = `kl-bday-${index}`;
      input.max = new Date().toISOString().split('T')[0];

      wrapper.append(label, input);
      container.appendChild(wrapper);
    }
  }

  async function submitBirthdays() {
    const email = document.getElementById('kl-email-2').value.trim();
    const errEl = document.getElementById('kl-err-2');
    const btn = document.getElementById('kl-btn-bday');

    if (!email || !email.includes('@')) {
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }

    errEl.textContent = '';
    btn.textContent = 'Saving…';
    btn.disabled = true;

    const properties = {
      number_of_children: numChildren
    };

    for (let index = 1; index <= numChildren; index += 1) {
      const birthday = document.getElementById(`kl-bday-${index}`)?.value;
      if (birthday) {
        properties[`child_${index}_birthday`] = birthday;
      }
    }

    try {
      await klSubscribeToList(email, KLAVIYO_CONFIG.childrenListId);
      await klUpdateProfile(email, properties);

      document.getElementById('kl-birthday-form').style.display = 'none';
      document.getElementById('kl-birthday-thanks').style.display = 'block';
    } catch (error) {
      console.error('[Klaviyo] Birthday form error:', error);
      errEl.textContent = 'Error saving details. Please try again.';
      btn.textContent = 'Save Birthday Details';
      btn.disabled = false;
    }
  }

  function closeBirthdayPopup() {
    document.getElementById('kl-birthday-overlay').classList.remove('active');
  }
</script>
