export async function onRequestGet({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: cors });

  const url = new URL(request.url);
  const playlistUrl = url.searchParams.get("url");
  if (!playlistUrl) return json({ error: "أرسل رابط قائمة YouTube." }, 400);
  if (!env.YOUTUBE_API_KEY) {
    return json({ error: "لم يتم إعداد مفتاح YouTube API على الخادم بعد." }, 503);
  }

  let playlistId = "";
  try {
    const parsed = new URL(playlistUrl);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(parsed.hostname) &&
        parsed.hostname !== "youtu.be") {
      return json({ error: "الرابط يجب أن يكون من YouTube." }, 400);
    }
    playlistId = parsed.searchParams.get("list") || "";
  } catch {
    return json({ error: "الرابط غير صالح." }, 400);
  }
  if (!playlistId) return json({ error: "لم أجد معرّف قائمة التشغيل في الرابط." }, 400);

  try {
    const videos = [];
    let pageToken = "";
    do {
      const api = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      api.searchParams.set("part", "snippet,contentDetails");
      api.searchParams.set("playlistId", playlistId);
      api.searchParams.set("maxResults", "50");
      api.searchParams.set("key", env.YOUTUBE_API_KEY);
      if (pageToken) api.searchParams.set("pageToken", pageToken);

      const response = await fetch(api.toString());
      const data = await response.json();
      if (!response.ok) {
        const reason = data?.error?.errors?.[0]?.reason || "";
        const message = reason === "quotaExceeded"
          ? "تم استهلاك حصة YouTube API اليومية."
          : "تعذّر قراءة القائمة. تأكد أنها عامة أو غير مدرجة وأن المفتاح صحيح.";
        return json({ error: message }, response.status === 403 ? 502 : 400);
      }

      for (const item of data.items || []) {
        const snippet = item.snippet || {};
        const videoId = item.contentDetails?.videoId || snippet.resourceId?.videoId;
        if (!videoId || snippet.title === "Deleted video" || snippet.title === "Private video") continue;
        videos.push({
          id: videoId,
          title: snippet.title || "محاضرة بدون عنوان",
          publishedAt: snippet.publishedAt || item.contentDetails?.videoPublishedAt || null,
          url: "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId),
          thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || ""
        });
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken && videos.length < 5000);

    videos.sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) return 0;
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(a.publishedAt) - new Date(b.publishedAt);
    });

    return json({
      playlistId,
      count: videos.length,
      sort: "oldest-to-newest",
      videos: videos.map((video, index) => ({ ...video, number: index + 1 }))
    });
  } catch {
    return json({ error: "حدث خطأ أثناء جلب بيانات القائمة. حاول مرة أخرى." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
