import express from 'express';
// import { getArtistWorks } from './bill.js';
const app = express();


app.get("/", async (req, res) => {
    res.send("Hello World!");
});

app.get("/bili/:Id", async (req, res) => {
    const artistItem = {
        id: req.params.Id
    }
    return res.json(await getArtistWorks(artistItem, 1, "main"))
})
app.listen(3000, () => {
    console.log(`Deploy successfully!`);
});

import axios from "axios";
import dayjs from "dayjs";
import he from "he";
import CryptoJs from "crypto-js";

// 抄的 来自 https://github.com/maotoumao/MusicFreePlugins
const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
};
let cookie;

/** 获取cid */
async function getCid(bvid, aid) {
    const params = bvid
        ? {
            bvid: bvid,
        }
        : {
            aid: aid,
        };
    const cidRes = (
        await axios.get("https://api.bilibili.com/x/web-interface/view?%s", {
            headers: headers,
            params: params,
        })
    ).data;
    return cidRes;
}

/** 格式化 */
function durationToSec(duration) {
    if (typeof duration === "number") {
        return duration;
    }

    if (typeof duration === "string") {
        var dur = duration.split(":");
        return dur.reduce(function (prev, curr) {
            return 60 * prev + +curr;
        }, 0);
    }

    return 0;
}

const searchHeaders = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
    accept: "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br",
    origin: "https://search.bilibili.com",
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    referer: "https://search.bilibili.com/",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
};
async function getCookie() {
    if (!cookie) {
        cookie = (
            await axios.get("https://api.bilibili.com/x/frontend/finger/spi", {
                headers: {
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/114.0.0.0",
                },
            })
        ).data.data;
    }
}
const pageSize = 20;
/** 搜索 */
async function searchBase(keyword, page, searchType) {
    await getCookie();
    const params = {
        context: "",
        page: page,
        order: "",
        page_size: pageSize,
        keyword: keyword,
        duration: "",
        tids_1: "",
        tids_2: "",
        __refresh__: true,
        _extra: "",
        highlight: 1,
        single_column: 0,
        platform: "pc",
        from_source: "",
        search_type: searchType,
        dynamic_offset: 0,
    };
    const res = (
        await axios.get("https://api.bilibili.com/x/web-interface/search/type", {
            headers: {
                ...searchHeaders,
                cookie: `buvid3=${cookie.b_3};buvid4=${cookie.b_4}`,
            },
            params: params,
        })
    ).data;
    return res.data;
}

/** 获取收藏夹 */
async function getFavoriteList(id) {
    const result = [];
    const pageSize = 20;
    let page = 1;

    while (true) {
        try {
            const {
                data: {
                    data: { medias, has_more },
                },
            } = await axios.get("https://api.bilibili.com/x/v3/fav/resource/list", {
                params: {
                    media_id: id,
                    platform: "web",
                    ps: pageSize,
                    pn: page,
                },
            });
            result.push(...medias);

            if (!has_more) {
                break;
            }
            page += 1;
        } catch (error) {
            console.warn(error);
            break;
        }
    }

    return result;
}

function formatMedia(result) {
    const title = he.decode(result.title?.replace(/(\<em(.*?)\>)|(\<\/em\>)/g, "") ?? "");
    return {
        id: result.cid ?? result.bvid ?? result.aid,
        aid: result.aid,
        bvid: result.bvid,
        artist: result.author ?? result.owner?.name,
        title,
        alias: title.match(/《(.+?)》/)?.[1],
        album: result.bvid ?? result.aid,
        artwork: result.pic?.startsWith("//") ? "http:".concat(result.pic) : result.pic,
        // description: result.description,
        duration: durationToSec(result.duration),
        tags: result.tag?.split(","),
        date: dayjs.unix(result.pubdate || result.created).format("YYYY-MM-DD"),
    };
}

function getMixinKey(e) {
    var t = [];
    return (
        [
            46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22,
            25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
        ].forEach(function (r) {
            e.charAt(r) && t.push(e.charAt(r));
        }),
        t.join("").slice(0, 32)
    );
}

function getRid(params) {
    const npi = "7cd084941338484aae1ad9425b84077c4932caff0ff746eab6f01bf08b70ac45";
    const o = getMixinKey(npi);
    const l = Object.keys(params).sort();
    let c = [];
    for (let d = 0, u = /[!'\(\)*]/g; d < l.length; ++d) {
        let [h, p] = [l[d], params[l[d]]];
        p && "string" == typeof p && (p = p.replace(u, "")), null != p && c.push("".concat(encodeURIComponent(h), "=").concat(encodeURIComponent(p)));
    }
    const f = c.join("&");
    const w_rid = CryptoJs.MD5(f + o).toString();
    return w_rid;
}

async function getArtistWorks(artistItem, page, type) {
    const queryHeaders = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
        accept: "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br",
        origin: "https://space.bilibili.com",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: `https://space.bilibili.com/${artistItem.id}/video`,
    };

    await getCookie();
    const now = Math.round(Date.now() / 1e3);
    const params = {
        mid: artistItem.id,
        ps: 30,
        tid: 0,
        pn: page,
        web_location: 1550101,
        order_avoided: true,
        order: "pubdate",
        keyword: "",
        platform: "web",
        dm_img_list: "[]",
        dm_img_str: "V2ViR0wgMS4wIChPcGVuR0wgRVMgMi4wIENocm9taXVtKQ",
        dm_cover_img_str: "QU5HTEUgKE5WSURJQSwgTlZJRElBIEdlRm9yY2UgR1RYIDE2NTAgKDB4MDAwMDFGOTEpIERpcmVjdDNEMTEgdnNfNV8wIHBzXzVfMCwgRDNEMTEpR29vZ2xlIEluYy4gKE5WSURJQS",
        dm_img_inter: '{"ds":[],"wh":[0,0,0],"of":[0,0,0]}',
        wts: now.toString(),
    };

    const w_rid = getRid(params);
    const res = (
        await axios.get("https://api.bilibili.com/x/space/wbi/arc/search", {
            headers: {
                ...queryHeaders,
                cookie: `buvid3=${cookie.b_3};buvid4=${cookie.b_4}`,
            },
            params: {
                ...params,
                w_rid,
            },
        })
    ).data;

    const resultData = res.data;
    const albums = resultData.list.vlist.map(formatMedia);

    return {
        isEnd: resultData.page.pn * resultData.page.ps >= resultData.page.count,
        data: albums,
    };
}
