---
title: Legacy devices, and solutions from the past to new problems
description: What a 1983 paper on automation says about supervising AI agents, tested on an app that syncs Plex playlists to an iPod.
pubDate: 2026-10-19
translationKey: legacy-devices
---

With the advance of AI, as a frontend engineer I see that my value is no longer about writing code, but more about what brings value to a product, and how to structure solutions to bring that value. One of those things could be figuring out how to make it easier for humans to supervise AI agents.

## The trigger: Deno acquired by Cloudflare

The news of [Deno being acquired by Cloudflare](https://blog.cloudflare.com/deno-joins-cloudflare/) made me wonder why Cloudflare wanted that team. It turns out it is mostly about something called celld. Celld is Deno's open-source version of Cloudflare Workers and Durable Objects: a single program you can run on your own servers, where each "cell" keeps its own state in its own small SQLite database. Cloudflare plans to merge it into workerd, their open-source runtime, and a lot of people see it as a foundation for running AI agents.

The idea behind [Durable Objects](https://developers.cloudflare.com/durable-objects/) is that instead of one big server holding everyone's state in a shared database, each thing gets its own small object: one per user, one per chat, one per job. It wakes up when a request arrives, goes to sleep when nobody is using it, and remembers its state while it sleeps. That is a good fit for agents, because an agent's job can keep running and keep its state even after you close the browser tab.

## Looking at solutions from the past for today's problems

Running agents creates new problems on the interface, since we need a way to make the user aware of these long running processes, what is the status, how far they are from completion, if they failed, and also ask the user for approval in case of destructive actions.

I am a big fan of looking at how people looked at similar problems in the past, and I found [Bainbridge's 1983 paper, Ironies of Automation](https://doi.org/10.1016/0005-1098(83)90046-8). It is about industrial control, things like chemical plants and aircraft, but the problem is the same as the one we have now. Long processes that are automated but may require human intervention when something goes wrong.

Bainbridge basically says that when you automate a process, the machine takes the easy parts and the human is left with the hardest ones. The human now mostly watches, and only steps in when something goes wrong. That is the worst moment to step in: you have the least context, you are out of practice, and after about 30 minutes of watching nobody pays attention anymore. The irony is that the more reliable the automation gets, the worse this becomes, because failures are rare and the human gets even less practice.

Her solutions are to make systems fail obviously instead of quietly hiding problems, to show the state so a person can understand it at a glance when they come back, to not ask people to approve or check things they have no way of checking, and to keep the human in practice so they can still take over when it matters.

## Having fun with legacy devices, and pretending to be researching

I decided to reuse a project of mine that syncs my [Plex](https://www.plex.tv) playlists to my iPod (yes, an iPod in 2026 is hip again) since those kinds of processes are similar to what agents do. Plex is a media server app that I use mostly to host and serve my MP3 collection. I also use [Jellyfin](https://jellyfin.org), which is open source, and my plan is to make this also work with Jellyfin down the road.

I already built [podscribe](https://github.com/menor/podscribe), a library that allows you to upload music to an iPod since it knows how to write the database iPods use. I have that wrapped in a command line script that (as of now) gets the name of a Plex playlist as an input, backs up the iPod database, wipes the iPod, downloads the music files, uploads them to the iPod and updates the internal iPod database.

This is a process that can take some time, so it was a good fit to take a look at how to design interfaces for those kinds of processes, similar to agents. I did podscribe as an external library, because the idea was to eventually have it running on a local web app. It has to be local: podscribe writes files straight to the iPod, and a browser can't do that on its own.

After thinking about it, the architecture for an MVP is the following one:
  - The user enters the name of the playlist and the iPod folder on the client
  - The client sends a POST request to `/jobs` with both
  - The server creates a job (our simplified durable object) that first plans, without touching the iPod:
    - Fetches the playlist from Plex and counts the tracks on the iPod, at the same time
    - Shows a preview: how many tracks, the total size, and how many tracks will be erased
    - Then it stops and waits for the user
  - If the user approves (a POST to `/jobs/:id/approve`), the job:
    - Backs up the iPod database and wipes the iPod
    - Downloads the music files
    - Uploads them to the iPod and updates the iPod database

The interesting part here was the job id. The browser listens on `/jobs/:id/events`, and every message carries the full state of the job. The first message is always the current state, so the screen is never out of date.

The user then can close the browser tab and come back later, and she will be presented with the status of the job. `/jobs/latest` finds the job again. The server is the one owning the job and its status.

One difference with a real Durable Object: my job lives in the server's memory, so if I restart the server, the job is gone. A Durable Object keeps its state even while it sleeps.

### Why Server-Sent Events and not WebSockets

To send the job state to the browser I used [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) (SSE). The server keeps an HTTP response open and writes a new message every time the job changes. On the browser side it is just an `EventSource`.

WebSockets were the obvious alternative, but they didn't fit:
  - **The updates only go one way.** The server talks, the browser listens. The browser only sends 2 commands, create the job and approve it, and a plain POST is enough for those. WebSockets give you a two-way channel I didn't need.
  - **SSE reconnects by itself.** If the connection drops, the browser opens it again without any code from me. With WebSockets you have to write that yourself. Together with the rule that the first message is always the current state, reconnecting just works.
  - **No extra library.** SSE is plain HTTP, so Node's built-in `node:http` is enough. Node has no built-in WebSocket server, so I would need a dependency like `ws`.

Sending the full state in every message, instead of only what changed, also helps. If the browser misses a message, the next one fixes the screen anyway.

If I add pause or cancel later, I can keep SSE and add one more POST endpoint for each.

## What does this iPod thing have to do with agents and ancient papers anyway?

I went back to Bainbridge and checked her solutions against what I was building:
  - **Fail obviously.** The downloads already retried up to 3 times, but silently. You only found out when the last try failed. Now the app counts retries and warns you about them, even when the sync succeeds.
  - **Understand it at a glance when you come back.** This changed my plan. I was about to polish the progress bar, but the hard moment is not watching the sync, it is coming back to it, especially when it failed. So I made the end screen the priority. It tells you if it finished or failed, why, how to fix it, what is on the iPod now, and if it is safe to unplug.
  - **Don't ask people to approve what they can't check.** I looked at what the backup actually does: it saves the iPod database, but the wipe still deletes all the audio files. So the backup can't undo a wipe, and the approval screen now says that plainly.
  - **Keep the human in practice.** I haven't done anything about this one yet.

My favorite part is that the tests ended up reading like rules for being honest about the iPod: "a failure while wiping says the state is unknown", "does not claim old music was erased when the iPod was empty", "only phases that touch the iPod say do not unplug".

This is still an early version, but it has been fun to explore. It already has a preview, an approval step, an end screen and 27 passing tests. For now I am just using a test folder and not touching the iPod yet, but I wanted to write about it while it is still fresh. Stay tuned for more on this topic. I am not hosting a demo of this anywhere, because I would have to make my Plex library public and everyone would find guilty pleasures I have in my music library like the [Xanadu soundtrack](https://en.wikipedia.org/wiki/Xanadu_(soundtrack)) by ELO and Olivia Newton-John 😅
