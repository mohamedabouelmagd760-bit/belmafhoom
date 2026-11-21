import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export async function GET(request:Request){
 const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return new NextResponse('Unauthorized',{status:401});
 const path=new URL(request.url).searchParams.get('path'); if(!path||!['course-materials/','enrollment-proofs/','teacher-subscription-proofs/','assignment-submissions/'].some(prefix=>path.startsWith(prefix)))return new NextResponse('Bad request',{status:400});
 const {data,error}=await s.storage.from('belmafhoom-private').createSignedUrl(path,60);
 if(error||!data?.signedUrl)return new NextResponse('Forbidden',{status:403});
 return NextResponse.redirect(data.signedUrl);
}
