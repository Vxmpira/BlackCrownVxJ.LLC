# BlackCrown support relay: SES setup

The support form on blackcrownvxj.com POSTs to `/api/support`. Nginx proxies that to a small Node service (`mailer.mjs`) which renders the branded template and sends through AWS SES. The visitor's address is set as Reply-To, so replying in Outlook goes straight to them.

Files in this folder:

| File | Purpose |
|---|---|
| `mailer.mjs` | The relay service (listens on 127.0.0.1:8787) |
| `templates.mjs` | Branded per-category email templates |
| `package.json` | One dependency: `@aws-sdk/client-sesv2` |
| `blackcrown-support.service` | systemd unit |
| `nginx-snippet.conf` | Location block to add to the site config |
| `iam-policy.json` | Send-only IAM policy for the EC2 role |

Also in the bundle, at the repo root:

| File | Purpose |
|---|---|
| `support.html` | Patched form: POSTs to `/api/support`, mailto only as network-failure fallback |
| `assets/img/email-header.png` | Brand banner the emails load (glowing crown + Space Grotesk wordmark) |
| `assets/img/email-crown.png` | Big crown on the visitor acknowledgment |

The two PNGs must be live at `https://blackcrownvxj.com/assets/img/` before emails look right; until then recipients see the alt text where the images sit, and everything else still renders. Deploy them with the same git pull.

## 1. SES identities (AWS console, one time)

Use region **us-east-1** (or edit `AWS_REGION` in the service file to match).

1. SES console > Identities > Create identity > **Domain** > `blackcrownvxj.com`. Keep Easy DKIM on. AWS shows 3 CNAME records; add them wherever your DNS for blackcrownvxj.com lives. Status flips to Verified within an hour, usually minutes. This lets you send from `support@blackcrownvxj.com` with no mailbox needed.
2. Create identity > **Email address** > `BlackCrownVxJ.LLC@outlook.com`. Click the link AWS emails you. SES starts in sandbox mode, where recipients must be verified; since the only recipient is your own inbox, this is all you need. No production access required.

Optional, recommended once the domain is verified: Identities > blackcrownvxj.com > set a custom MAIL FROM domain (e.g. `mail.blackcrownvxj.com`) and add the shown MX and TXT records. Improves deliverability to Outlook.

## 2. IAM role for the EC2 instance (one time)

The relay signs SES calls with the instance role, so no keys ever sit on the server.

1. IAM console > Roles > Create role > Trusted entity: **AWS service > EC2**.
2. Skip the policy picker, create the role (name it `blackcrown-ses-send`), then open it > Add permissions > Create inline policy > JSON > paste `iam-policy.json`.
3. EC2 console > your instance > Actions > Security > **Modify IAM role** > attach `blackcrown-ses-send`. If the instance already has a role, add the inline policy to that role instead. No reboot needed.

## 3. Install on the EC2 (after git pull)

```bash
cd /var/www/blackcrown/server/support
npm install

# Node 18+ required
node -v

sudo cp blackcrown-support.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blackcrown-support
systemctl status blackcrown-support
```

## 4. Nginx route

Open the site config (e.g. `/etc/nginx/sites-available/blackcrown`), paste the `location /api/support` block from `nginx-snippet.conf` inside the existing `server { }` block for blackcrownvxj.com, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Test

```bash
# Service up?
curl -s http://127.0.0.1:8787/api/support/health

# End to end through Nginx and SES (sends a real email to your inbox):
curl -s https://blackcrownvxj.com/api/support \
  -H 'Content-Type: application/json' \
  -d '{"name":"Deploy Test","email":"BlackCrownVxJ.LLC@outlook.com","concern":"Bug or technical issue","message":"Testing the SES relay end to end."}'
```

Expect `{"success":true}` and a branded email in the inbox within seconds. If it fails, `journalctl -u blackcrown-support -n 50` shows why (most common: identity not verified yet, or role not attached).

Then submit the live form at blackcrownvxj.com/support.html once yourself.

## 6. Visitor acknowledgment emails (later, optional)

The relay can also send the branded "Message received" email to the visitor. That means emailing unverified addresses, which sandbox mode blocks. When you want it: SES console > Account dashboard > **Request production access** (state it is transactional support-form mail, low volume). Once approved, set `SEND_ACK=1` in the service file and `sudo systemctl daemon-reload && sudo systemctl restart blackcrown-support`.

## Behavior notes

- Honeypot: the hidden `botcheck` field gets a fake success, nothing is sent.
- Rate limit: 5 submissions per IP per 10 minutes, then HTTP 429 and the form tells the visitor to slow down or email directly.
- Fallback: if the relay is unreachable, support.html falls back to the old mailto behavior, so the form never dead-ends.
- Templates: edit `templates.mjs` (colors, triage notes, copy per category), then `sudo systemctl restart blackcrown-support`. Preview locally with `node` by calling `notifyEmail`/`ackEmail` and writing the html to a file.
