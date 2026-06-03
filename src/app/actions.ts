// 'use server'
// import { supabase } from '@/utils/supabase';

// export async function rollItem(userId: string) {
//   // 1. Generate the RNG (1/X logic)
//   const roll = Math.random();
//   let item = { slug: 'alpha_scrap', type: 'material' };

//   if (roll < 0.1) { // 1/10 Chance
//     item = { slug: 'beta_scrap', type: 'material' };
//   }

//   // 2. Insert into Supabase
//   const { data, error } = await supabase
//     .from('inventory')
//     .insert([
//       { 
//         user_id: userId, 
//         item_slug: item.slug, 
//         item_type: item.type 
//       }
//     ]);

//   if (error) return { success: false, error: error.message };
//   return { success: true, item };
// }