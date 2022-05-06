---
layout: post
title: "Decentralized content moderation system for Twitter"
description: "Proposal for a decentralized content moderation system for social media"
category: blockchain
comments: false
---
In this post I will try to lay out a proposal for a decentralized content moderation system for twitter, but it would work for any social media platform. I'm just using Twitter as an example here because I like it best.

When I will be referring to Twitter in this post I will also refer to a decentralized version of Twitter with its own native token, as it's very hard to do a decentralized content moderation system it in a centralized platform, as you need a form of collateral (in this case twt tokens).

At a very abstract level, a Twitter is not much different form a democratic State; you have a bunch of parties with different motives and goals that exist in a given system which they have influence upon and that needs moderation and enforcement of rules to work properly. Because of these similarities I propose a system for content moderation that is very close to the judicial system of a state. In a traditional system (state) it's "users" stake personal freedom and wealth, but of course you can't do that in blockchain land, so we're going to use twt tokens.

### Policy (enforcement)

Easy policies. And when I say easy I mean easy; maybe up to 10 rules for the whole platform on how to behave, mostly common sense stuff (e.g. no death threads; be nice; etc.). The goal here is that literally everybody who uses the platform can understand all its rules and knows when he/she violates them. Here we have an advantage of decentralized platform, the policies are made by the people for other people to read not by lawyers for other lawyers.

 Have a prosecutor, defender & judge system for policy violation: The process is as follows 1) prosecutor P sees a post by Defender D he thinks violates Twitters rules. He reports the post and stakes 100twt to back his report. 2) D gets a message his post has been flagged and can now a) also stake 100twt and go to court over if it's a violation or b) accept the report, delete the post and get a small fine (and P gets a portion of that fine as a reward). 3) If he does oppose the report and stakes his 100twt the case gets send to a judge who then decides. The winner gets >50% of the combined stake pool, with fractions going to the judge and maybe a network handling fee. This punishes wrong behavior and while also discouraging filing reports for nothing.
 
### The Judge System

One large Problem that remains is who are the Judges, who appoints them and how does the network protect itself against corrupt Judges. I propose a multi-layer Judge system as sketched out below.

<img src="/img/twitter_judge_layers.png" alt="title">

The way the system works is that 1) every judge has to stake a rather substantial amount of twt to become a judge (with every layer/level judges having to stake substantially more than his predecessor), this is the only necessary prerequisite to become a judge and 2) there is an appeal process; if you think the judge handling your case ruled wrongly against you, you can stake a higher amount and appeal to a higher layer judge to look at the case. If that L2 judge decides in your favour and against the L1 judges ruling, the L1 Judge would lose his stake, thus promoting honest behavior. (It is still to be determined how high these stake amount need to be for the system to work best and not promote gambling while being accessible for people with lower twt balances.) If a L2 Judge overrules a L1 Judge, both the L1 Judge and the original prosecutor P can appeal again to a higher Layer Judge (in this case L3) to look at the issue.

This process can of course not continue infinitely, so there is a supreme court as the highest institution of jurisdiction. This Supreme Court consists of multiple parties and is elected democratically by twt (or an equivalent) holders. Due to the nature of the System it is very improbable that many cases reach the SC, as it's very expensive to stake all the twt necessary, should the SC rule in your favour though you would gain quite a lot, and it would (as in the real system) have consequences for how lower layer judges rule in the future.

Let's look at an example to help understand the system:

P comes across a post by D stating "I'm literally going to kill Jack". He flags the post as a violation against the no death threads policy and stakes 100twt. D opposes the flag, and he also stakes 100twt, claiming it's not a violation of the policy. The case gets send to JL1. JL1 decides in P's favour and the trust, containing the 200twt, is to be split 70% to P, 20% to JL1 and 10% for the network treasury. D can now accept the judges ruling or stake 400 for a L2 judge to look at it, which he does. JL2 also decides in P's favour and now the trust (containing 600twt) is split 50% for P, 15% for JL1, 25% for JL2 and 10% for the network. This time D accepts the ruling and the twt is paid out.

The percentages in the example are also just exemplary. What is important however is that JL2 gets paid more than JL1, as he has a higher stake in the network.

