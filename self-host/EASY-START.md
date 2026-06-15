# Run Your Own SoundDocs — The Easy Way

The free, hosted version of SoundDocs is going away on **September 1, 2026**. The
good news: SoundDocs is free and open, so you can run your very own private copy
on your own computer and keep all your patch sheets, stage plots, and the rest —
forever, for free. This whole thing takes about **15 minutes**, and the only
program you need to install is one free app called **Docker Desktop**. After
that, starting SoundDocs is as easy as double-clicking a file and waiting.

No coding required. Just follow the steps below in order.

> **Before you start:** if you still have access to the hosted SoundDocs (before
> September 1, 2026), open your **Profile** page there and use the **export**
> button to download your `sounddocs-backup-...json` file. Keep it somewhere
> easy to find, like your Desktop. You'll load it into your own copy in Step 5.

---

## Step 1 — Install Docker Desktop

Docker Desktop is a free app that runs SoundDocs behind the scenes. You only
install it once.

1. Go to **https://www.docker.com/products/docker-desktop/**
2. Download the version for your computer:
   - **Mac:** choose the button that matches your Mac. If you're not sure
     whether you have an "Apple chip" or "Intel chip," click the Apple menu in
     the top-left corner of your screen, choose **About This Mac**, and look at
     the **Chip** or **Processor** line.
   - **Windows:** download the Windows version.
3. Open the downloaded file and follow the simple installer.
4. **Open Docker Desktop** after installing. Wait a minute until it finishes
   starting up — you'll see a little **whale icon** that stops moving once it's
   ready. Leave it running.

That's the only thing you have to install. Everything else is automatic.

---

## Step 2 — Download SoundDocs

1. Go to **https://github.com/SoundDocs/sounddocs**
2. Click the green **Code** button near the top-right.
3. In the little menu that appears, click **Download ZIP**.
4. Find the downloaded ZIP file (usually in your **Downloads** folder) and
   **unzip** it:
   - **Mac:** double-click the ZIP file. A new folder appears next to it.
   - **Windows:** right-click the ZIP file, choose **Extract All…**, then click
     **Extract**.

You now have a folder called something like **sounddocs** (or
**sounddocs-main**).

---

## Step 3 — Start SoundDocs

1. Open the unzipped **sounddocs** folder.
2. Open the folder inside it named **`self-host`**.
3. Double-click the start file for your computer:
   - **Mac:** double-click **`start.command`**
   - **Windows:** double-click **`start.bat`**

> **Mac note — "unidentified developer":** the very first time, your Mac might
> refuse to open the file and mention an "unidentified developer." That's
> normal. Just **right-click** (or hold Control and click) **`start.command`**,
> choose **Open**, and then click **Open** again in the box that pops up. You
> only have to do this once.

A black or white text window will open and start showing messages. That's
SoundDocs setting itself up. You don't need to type anything — just let it run.

---

## Step 4 — Wait for it to finish

The **first time** you start SoundDocs, it downloads everything it needs
automatically. This can take **a few minutes** depending on your internet
speed — sometimes just one or two minutes on a fast connection. You'll see dots
and messages appearing; that means it's working, not stuck.

When everything is ready, **your web browser will open automatically** to your
own private SoundDocs. When you see the SoundDocs page, **you're done!** 🎉

(Every time after this, starting is much faster.)

---

## Step 5 — Create your account and bring in your data

1. In the SoundDocs page that just opened, **create an account** (any email and
   password you like — this stays private on your computer).
2. After you're signed in, SoundDocs will offer a **first-run setup**. Choose to
   **import a backup**, then pick the **`sounddocs-backup-...json`** file you
   downloaded from your Profile on the hosted app (see the note at the top of
   this guide).
3. SoundDocs will load all your documents. That's it — your work is now in your
   own copy.

> Didn't grab a backup before the hosted app closed? You can still use your new
> copy normally; you'll just start with a fresh, empty SoundDocs. Remember to
> export your data **before September 1, 2026** if you want to keep it.

---

## Step 6 — Stopping and starting later

- **To stop SoundDocs:** open the **`self-host`** folder and double-click
  **`stop.command`** (Mac) or **`stop.bat`** (Windows). Your data stays safe.
- **To start it again later:** double-click **`start.command`** (Mac) or
  **`start.bat`** (Windows) again. After the first time, it starts quickly.

You can also just quit Docker Desktop to stop everything, and reopen it plus
double-click start when you want SoundDocs back.

---

## If something goes wrong

Don't worry — these are the usual hiccups and they're easy to fix.

- **"Docker is not running" message.** Open **Docker Desktop** and wait for the
  whale icon to settle (it stops animating). Then double-click the start file
  again.

- **The first start is really slow / lots of waiting.** This is normal the
  **first** time only — it's downloading everything it needs. As long as you see
  dots or messages appearing, it's working. Give it a few minutes.

- **The browser page is blank or won't load.** The app may still be finishing
  its build. Wait another minute, then **refresh** the page. If your browser
  didn't open at all, you can type **http://localhost:3000** into your browser's
  address bar yourself.

- **A message about a "port" being "already in use."** Something else on your
  computer is already using the same doorway (port) SoundDocs wants. The
  simplest fix is to **close other apps** that might be using it and try again.
  If it keeps happening, you can change which port SoundDocs uses — see the
  "Troubleshooting" section of **[SELF_HOSTING.md](../SELF_HOSTING.md)** for the
  one-line change.

- **Still stuck?** The more detailed, technical guide lives in
  **[SELF_HOSTING.md](../SELF_HOSTING.md)**. It covers backups, security, and
  what's happening under the hood.

---

## Want the technical details?

This guide keeps things simple on purpose. If you're comfortable with a bit more
detail — how the pieces fit together, how to back up your database, security
tips for running it on a server, and more — read the full
**[SELF_HOSTING.md](../SELF_HOSTING.md)** guide.

Welcome to your own SoundDocs. Enjoy! 🎚️
