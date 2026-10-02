# Managing the Invitly journal and social links

The journal lives at `/blog`, with six topic pages and an individual page for each published article. The footer links to all six topics. Content is stored in this repository; there is no admin writing screen yet. Updates go live after a new production build and deployment.

## Add an article

1. Duplicate `content/blog/draft-example.json` with a descriptive filename.
2. Give it a unique lowercase, hyphenated `slug`. This becomes `/blog/your-slug`.
3. Edit the title, excerpt, date and sections. Set `topic` to one of the values below.
4. Keep `status` as `draft` while writing. Drafts do not appear in lists or public article routes.
5. When ready, change `status` to `published`, run `npm run build`, review the local page, and deploy the site using your normal deployment process.

```json
{
  "title": "A warm welcome to our new home",
  "slug": "a-warm-welcome-to-our-new-home",
  "topic": "housewarming",
  "excerpt": "Personal words and clear directions for your first gathering.",
  "date": "2026-09-30",
  "status": "draft",
  "sections": [
    {
      "heading": "Start with your own words",
      "paragraphs": ["Write the opening paragraph here."],
      "quote": "નવું ઘર, પોતાના લોકોની રાહ",
      "quoteLang": "gu-IN",
      "list": ["Add your date and time.", "Check the address and directions."]
    }
  ]
}
```

`quote`, `quoteLang` and `list` are optional. Use plain text; React safely renders it without HTML. Dates use `YYYY-MM-DD`. The date is displayed and used for sorting; future dates do not schedule publication. Status controls publication. Duplicate slugs or malformed fields fail the build with a content error.

| Footer topic | `topic` value |
| --- | --- |
| Weddings | `wedding` |
| Engagements | `engagement` |
| Birthdays | `birthday` |
| Housewarming | `housewarming` |
| Digital invitation trends | `digital-invitations` |
| Ganesh Chaturthi invitations | `ganesh-chaturthi` |

Optional article image: put the file in `public/images/blog/` and add `"coverImage": { "src": "/images/blog/your-image.webp", "alt": "Describe the image", "width": 1200, "height": 800 }`. Use its real dimensions. This appears on the article; index cards use the journal's illustrated topic artwork.

The six starter articles are original editable copy. Ganesh Chaturthi content points to **Other gathering**, where the host can set their own wording, schedule and date.

## Connect social media

Edit `src/data/site-socials.ts` and fill each `url` with Invitly's full public profile URL, beginning with `https://`. Instagram, Facebook, YouTube, X and LinkedIn are included. Blank URLs show labelled, inactive “coming soon” icons. Adding a URL automatically turns its icon into an accessible external link; no component edits are needed. Rebuild and deploy to publish the changes.

## Invitation wording

In `/customize`, open **Details → Say it your way**. Choose English, Hinglish, Hindi, Punjabi, Marathi or Gujarati, preview the four lines, then press **Use this wording**. Only the cover, opening, message and closing change. Names, dates, places and blessings stay as entered. Edit any line afterward and save the draft as usual.

Preset copy is in `src/data/invitation-wording.ts`, with occasion-specific wording for all nine occasions. Language is chosen by the host, independently of tradition or template. Wedding demo cover lines are in `src/data/occasion-demos.ts`; shared demo body copy is in `src/data/demo-invitation.ts`.
