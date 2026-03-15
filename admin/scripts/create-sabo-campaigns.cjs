require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

const campaigns = [
  // Campaign 1: Launch Awareness - Facebook + LinkedIn
  {
    name: 'SABO Arena Launch Awareness',
    type: 'social_media',
    status: 'scheduled',
    platforms: ['facebook', 'linkedin'],
    scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    target_audience: JSON.stringify({
      age: '18-45',
      interests: ['billiards', 'bida', 'pool', 'sports', 'gaming'],
      location: 'Vietnam'
    }),
    content: `[BILLIARDS] CHAO MUNG DEN VOI SABO ARENA! [BILLIARDS]

Nen tang giai dau Billiards dau tien va chuyen nghiep nhat Viet Nam da chinh thuc ra mat!

[TROPHY] Tham gia giai dau chuyen nghiep
[CHART] He thong xep hang ELO minh bach
[DIAMOND] Tich diem SPA doi qua hap dan
[HOUSE] Tim CLB gan ban de dang

[TARGET] Dac biet: Dang ky ngay nhan 100 SPA Points mien phi!

[PHONE] Download ngay tai App Store & Google Play
[LINK] saboarena.com

#SABOArena #Billiards #BidaVietNam #Pool #GiaiDau`
  },
  
  // Campaign 2: Feature Highlight - Instagram + TikTok  
  {
    name: 'SABO Arena - ELO Ranking System',
    type: 'social_media',
    status: 'scheduled',
    platforms: ['instagram', 'threads'],
    scheduled_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    target_audience: JSON.stringify({
      age: '18-35',
      interests: ['sports apps', 'competitive gaming', 'billiards'],
      location: 'Vietnam'
    }),
    content: `Ban choi bi-a gioi ma khong ai biet? [BILLIARDS]

SABO Arena co he thong xep hang chuan quoc te:

[CHART] 12 cap bac: K -> K+ -> I -> I+ -> H -> H+ -> G -> G+ -> F -> F+ -> E -> E+
[TROPHY] ELO Rating tu 1000 den 2100+
[SCALE] Thi dau cong bang theo trinh do
[TRENDING] Leaderboard khu vuc & toan quoc

Rank cang cao = Thuong cang lon! [DIAMOND]

Tai app ngay de bat dau leo rank! [ROCKET]

#SABOArena #ELORating #Billiards #Ranking #BidaVietNam`
  },

  // Campaign 3: Tournament Promo - All platforms
  {
    name: 'SABO Arena Weekend Tournament',
    type: 'social_media',
    status: 'scheduled',
    platforms: ['facebook', 'instagram', 'linkedin', 'twitter'],
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    target_audience: JSON.stringify({
      age: '20-40',
      interests: ['billiards tournament', 'competitive pool'],
      location: 'Ho Chi Minh City, Hanoi'
    }),
    content: `[TROPHY] GIAI DAU CUOI TUAN - DANG KY NGAY! [TROPHY]

[CLIPBOARD] SABO Weekend Championship
[CALENDAR] Thu 7-CN tuan nay
[LOCATION] Cac CLB doi tac tren toan quoc
[BILLIARDS] Format: 9-ball Double Elimination

[MONEY] Tong giai thuong: 10,000,000 VND
[CASH] Phi tham gia: CHI 100,000 VND

[CHECK] Danh cho tat ca cac rank
[CHECK] Tich diem SPA gap doi
[CHECK] Livestream truc tiep tren app

[CLOCK] Con 48 slot - Dang ky ngay tren SABO Arena app!

#SABOArena #Tournament #Billiards #Weekend #GiaiDau`
  },

  // Campaign 4: Community Building
  {
    name: 'SABO Arena Community Stories',
    type: 'social_media',
    status: 'draft',
    platforms: ['facebook', 'instagram'],
    scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    target_audience: JSON.stringify({
      age: '18-50',
      interests: ['community', 'sports stories'],
      location: 'Vietnam'
    }),
    content: `[CAMERA] CAU CHUYEN NGUOI CHOI SABO ARENA

"Tu rank K den rank G chi trong 3 thang - SABO Arena da thay doi cach toi choi bi-a!" 
- Anh Minh, 28 tuoi, Quan 1

[TARGET] Ban co cau chuyen voi SABO Arena?
[CHAT] Comment ben duoi hoac tag #SABOStory de duoc feature!

[COMMUNITY] Cong dong 10,000+ tay co dang cho ban!

#SABOArena #SABOStory #Community #Billiards #BidaVietNam`
  },

  // Campaign 5: App Features Deep Dive
  {
    name: 'SABO Arena - SPA Points Rewards',
    type: 'social_media',
    status: 'scheduled',
    platforms: ['facebook', 'instagram', 'threads'],
    scheduled_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    target_audience: JSON.stringify({
      age: '18-40',
      interests: ['rewards', 'points system', 'gaming'],
      location: 'Vietnam'
    }),
    content: `[DIAMOND] TICH DIEM SPA - NHAN QUA KHUNG! [DIAMOND]

Choi bi-a tren SABO Arena = Nhan thuong!

[GIFT] Doi duoc gi voi SPA Points?
- 500 pts -> Voucher giam 50% phi ban
- 1000 pts -> Cay co cao cap
- 2000 pts -> Membership VIP 1 thang
- 5000 pts -> iPhone hoac Samsung flagship!

[TRENDING] Cach kiem SPA Points:
[CHECK] Thang tran: +50 pts
[CHECK] Tham gia giai: +100 pts
[CHECK] Vo dich: +500 pts
[CHECK] Moi ban be: +200 pts

[FIRE] Dang ky ngay nhan 100 pts Welcome Bonus!

#SABOArena #SPAPoints #Rewards #Billiards #FreeGifts`
  }
];

async function main() {
  console.log('====================================');
  console.log('CREATING SABO ARENA CAMPAIGNS');
  console.log('====================================\n');
  
  let successCount = 0;
  
  for (const campaign of campaigns) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert([campaign])
      .select();
    
    if (error) {
      console.log('ERROR creating:', campaign.name);
      console.log('   ', error.message);
    } else {
      successCount++;
      console.log('[OK] Created:', campaign.name);
      console.log('   Status:', campaign.status);
      console.log('   Platforms:', campaign.platforms.join(', '));
      console.log('   Scheduled:', new Date(campaign.scheduled_at).toLocaleString('vi-VN'));
      console.log('');
    }
  }
  
  console.log('====================================');
  console.log('DONE! Created', successCount, '/', campaigns.length, 'campaigns');
  console.log('====================================');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
