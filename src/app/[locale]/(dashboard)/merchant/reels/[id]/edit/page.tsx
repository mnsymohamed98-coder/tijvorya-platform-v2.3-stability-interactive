"use client";
import { useParams } from "next/navigation";
import { ReelForm } from "@/components/forms/reel-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";
export default function Page(){const params=useParams<{id:string}>();const{locale,reels}=useApp();const reel=reels.find(r=>r.id===params.id);return <><PageHeader eyebrow="EDIT REEL" title={locale==="ar"?"تعديل الريلز":"Edit reel"}/>{reel?<ReelForm reel={reel}/>:<div className="empty-state"><h2>{locale==="ar"?"الريلز غير موجود":"Reel not found"}</h2></div>}</>}
