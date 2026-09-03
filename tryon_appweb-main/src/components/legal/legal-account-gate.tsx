"use client";
import {useEffect,useState} from "react";
import {getLegalAcceptanceStatus} from "@/lib/legal-api";
import {LegalConsentModal} from "./legal-consent-modal";
export function LegalAccountGate(){const [open,setOpen]=useState(false);useEffect(()=>{void getLegalAcceptanceStatus().then(s=>setOpen(!s.complete)).catch(()=>{})},[]);return <LegalConsentModal open={open} onClose={()=>{}} onAccepted={()=>setOpen(false)}/>;}
