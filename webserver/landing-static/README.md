# Souqna Syria landing page — static deployment

This folder is a self-contained static landing page. It contains no API keys, no user data, and no build requirement.

## GitHub Pages

1. Create a **public** repository, for example `souqna-syria-landing`.
2. Copy the contents of this folder to the repository root, including `.nojekyll`.
3. Push to the `main` branch.
4. Open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
5. GitHub displays the final `github.io` link after deployment.

## Vercel

1. Create a Vercel project from the GitHub repository.
2. Set the **Root Directory** to this folder if it is part of a larger repository; otherwise leave it at the repository root.
3. Framework preset: **Other**. Build command: leave empty. Output directory: leave empty.
4. Confirm deployment. `vercel.json` supplies a basic safe response header.

Do not use Vercel Hobby as the long-term commercial home of the classified marketplace; retain the current platform hosting for the live product.
