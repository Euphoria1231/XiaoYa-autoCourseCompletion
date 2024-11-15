// ==UserScript==
// @name         小雅刷课
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  小雅刷课脚本，在网页端直接运行
// @author       You
// @match        https://whut.ai-augmented.com/app/jx-web/mycourse/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-augmented.com
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    async function handleVideoAndDoc() {
        const sourceURL = 'https://whut.ai-augmented.com/api/jx-iresource/';
        const getCookie = (cookie) => {
            const regExpCookie = /WT-prd-access-token=[a-zA-Z0-9]{32}/;
            const regExpToken = /[a-zA-Z0-9]{32}/;
            const token = regExpToken.exec(regExpCookie.exec(cookie)[0])[0];
            return token;
        }
        const token = getCookie(document.cookie);
        const headers = {
            Authorization: `Bearer ${token}`,
        };
        const group_id = /\d{19}/.exec(/mycourse\/\d{19}/.exec(location.href)[0])[0];
        const URL = `${sourceURL}resource/queryCourseResources?group_id=${group_id}`;
        const getAsyncData = async (headers, URL) => {
            const res = await fetch(URL, {
                method: 'GET',
                headers: headers
            });
            const data = await res.json();
            return data.data;
        };
        const postData = async (url, headers, data) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    ...headers,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            return res.json();
        };
        const courseJobs = await getAsyncData(headers, URL);
        try {
            for (const job of courseJobs) {
                const node_id = job.id;
                const job_type = job.type;
                const name = job.name;
                if (!("task_id" in job)) {
                    updateWindow(`${name}: 不是任务!`, "red");
                    continue;
                }
                if (job_type === 9) {
                    let url = `${sourceURL}resource/task/studenFinishInfo?group_id=${group_id}&node_id=${node_id}`;
                    const assignId = await getAsyncData(headers, url);
                    const assign_id = assignId.assign_id;
                    url = `${sourceURL}resource/queryResource?node_id=${node_id}`;
                    const result = await getAsyncData(headers, url);
                    const quote_id = result.quote_id;
                    const media_id = result.resource.id;
                    const duration = result.resource.duration;
                    const task_id = result.task_id;
                    let data = {
                        "video_id": "0000000000000000000",
                        "played": duration,
                        "media_type": 1,
                        "duration": duration,
                        "watched_duration": duration
                    };
                    url = `${sourceURL}vod/duration/${quote_id}`;
                    await postData(url, headers, data);
                    url = `${sourceURL}vod/checkTaskStatus`;
                    data = {
                        "group_id": group_id,
                        "media_id": media_id,
                        "task_id": task_id,
                        "assign_id": assign_id
                    };
                    const res = await postData(url, headers, data);
                    updateWindow(`${name} 完成！`, "green");
                } else if (job_type === 6) {
                    const task_id = job.task_id;
                    const url = `${sourceURL}resource/finishActivity`;
                    const data = {
                        "group_id": group_id,
                        "task_id": task_id,
                        "node_id": node_id
                    };
                    const res = await postData(url, headers, data);
                    updateWindow(`${name} 完成！`, "green");
                } else {
                    updateWindow(`${name} 不是视频或文档！`, "orange");
                }
            }
        } catch (e) {
            updateWindow('解析错误！', "red");
        }
    }
    function createWindow() {
        const button = document.createElement("button");
        button.innerText = "点击开始自动刷课";
        const span = document.createElement("span");
        span.innerText = '-';
        span.style.position = 'absolute';
        span.style.top = '5px';
        span.style.right = '5px';
        span.style.cursor = 'pointer';
        span.style.fontWeight = 'bold';
        span.style.fontSize = '18px';
        const div = document.createElement('div');
        div.id = 'answer-window';
        div.style.position = 'fixed';
        div.style.bottom = '10px';
        div.style.right = '10px';
        div.style.padding = '20px';
        div.style.backgroundColor = 'white';
        div.style.border = '1px solid black';
        div.style.zIndex = '10000';
        div.style.maxHeight = '300px';
        div.style.overflowY = 'auto';
        div.appendChild(span);
        div.appendChild(button);
        const answerList = document.createElement('div');
        answerList.innerHTML = '<div id="answer-list"></div>';
        div.appendChild(answerList);
        let isCollapsed = false;
        div.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                answerList.innerHTML = '<div id="answer-list"></div>';
                handleVideoAndDoc();
            }
            else if (e.target.tagName === 'SPAN') {
                isCollapsed = !isCollapsed;
                if (isCollapsed) {
                    div.style.maxHeight = '10px';
                    div.style.overflow = 'hidden';
                    answerList.style.display = 'none';
                    button.style.display = 'none';
                    span.innerText = "+";
                } else {
                    div.style.maxHeight = '300px';
                    div.style.overflowY = 'auto';
                    span.innerText = "-";
                    button.style.display = 'block';
                    answerList.style.display = 'block';
                }
            }
        });
        document.body.appendChild(div);
    }
    function updateWindow(msg, color = "black") {
        const answerList = document.getElementById('answer-list');
        const p = document.createElement('p');
        p.textContent = msg;
        p.style.color = color;
        answerList.appendChild(p);
    }
    createWindow();
})();
