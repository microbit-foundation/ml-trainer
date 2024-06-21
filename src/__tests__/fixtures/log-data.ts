/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { number } from 'svelte-i18n';

export const validLogData = `still,0000000000111110000000000;shake,0000010101010100000000000;
x,y,z
action,still,
-40,624,-856
-52,672,-856
-72,580,-836
-12,664,-860
-28,596,-848
-52,644,-860
-20,688,-836
-4,676,-860
-40,588,-832
-72,560,-828
-60,572,-844
-20,672,-868
-52,572,-828
-20,652,-848
-64,600,-844
-60,592,-852
-48,592,-852
-52,592,-844
-36,632,-844
-52,612,-836
-40,624,-836
-44,616,-840
-40,624,-844
-32,628,-832
-28,612,-852
-28,624,-848
-32,620,-840
-40,624,-860
-52,628,-840
-40,612,-840
-44,616,-848
-36,620,-844
-40,628,-868
-40,612,-832
-36,620,-856
-40,616,-848
-32,620,-848
-32,620,-852
-36,624,-848
-36,616,-836
-36,624,-864
-44,624,-856
-32,624,-852
-40,628,-828
-36,624,-840
-28,620,-836
-36,620,-844
-40,628,-840
-40,620,-840
-44,632,-848
-32,620,-860
-32,624,-860
-40,628,-840
-40,624,-832
-28,612,-844
-32,616,-840
-36,632,-828
-36,616,-840
-36,620,-864
-40,624,-844
-40,624,-848
-48,620,-836
-32,620,-852
-36,620,-860
-40,624,-840
-40,616,-852
-36,612,-844
-40,628,-856
-36,620,-852
-36,612,-828
-24,616,-868
-36,604,-856
-40,616,-860
-40,612,-852
-32,620,-864
-32,616,-856
-28,612,-844
-36,608,-856
-32,616,-856
-28,604,-860
action,shake,
-52,600,-856
-48,556,-868
-24,716,-872
-64,548,-840
-84,448,-828
-32,588,-864
-24,692,-880
-24,728,-892
-76,540,-860
-24,656,-868
-48,612,-868
-76,552,-856
-56,608,-856
-48,604,-860
-68,572,-868
-44,592,-852
-52,612,-872
-48,620,-896
-56,580,-860
-52,632,-876
-44,624,-860
-52,600,-868
-44,604,-860
-48,604,-856
-60,600,-872
-52,600,-860
-52,596,-860
-52,592,-864
-40,600,-852
-52,616,-872
-48,600,-860
-48,612,-868
-52,608,-860
-40,608,-856
-44,604,-868
-52,600,-856
-44,596,-848
-52,600,-864
-48,604,-860
-44,608,-848
-48,596,-860
-44,604,-884
-44,604,-860
-48,604,-864
-40,604,-868
-44,604,-864
-48,608,-868
-48,600,-844
-44,604,-868
-40,604,-852
-48,608,-856
-48,592,-860
-44,596,-856
-44,604,-848
-48,608,-856
-44,608,-860
-48,600,-852
-48,604,-848
-52,608,-856
-48,604,-844
-52,600,-856
-40,604,-856
-44,608,-860
-40,604,-872
-48,608,-856
-48,600,-852
-44,596,-848
-52,608,-872
-44,604,-856
-52,612,-856
-52,608,-864
-44,608,-872
-48,596,-872
-44,604,-844
-48,604,-852
-48,600,-864
-52,604,-860
-44,600,-872
-44,600,-864
-40,600,-868
action,still,
200,-12,-1032
260,-36,-1016
208,-60,-1012
236,-68,-928
244,-124,-944
280,-52,-1048
176,-196,-1068
188,-176,-1000
344,-188,-888
184,-152,-1128
152,-84,-1156
92,-76,-1008
4,-108,-980
80,-12,-972
44,-172,-872
-8,-84,-1072
-88,-68,-1020
-68,-36,-832
728,-248,-1144
172,-300,-908
132,-268,-1024
240,-416,-1200
28,-264,-1048
68,-316,-1064
60,-304,-984
96,-348,-924
120,-396,-884
136,-428,-1156
32,-384,-948
-100,-272,-972
-44,-220,-964
-140,-232,-1032
-236,-176,-920
-388,-300,-1160
-224,-148,-1136
-100,-264,-1112
-132,-176,-956
-188,-72,-908
-368,-92,-1212
-400,-92,-1136
-344,-32,-1060
-128,-188,-1352
-48,-160,-852
-136,104,-816
-176,68,-324
220,-296,-868
-416,348,-936
356,-208,-1136
252,-328,-968
136,84,-844
288,-4,-1172
240,-96,-1132
172,-324,-808
356,-600,-688
252,-256,-992
108,68,-1036
292,-192,-992
312,-212,-928
308,-244,-1020
296,-112,-928
212,8,-960
408,-192,-1072
364,-136,-1100
312,-76,-1104
272,48,-1064
268,-100,-920
168,-88,-1128
252,16,-1084
364,-164,-1048
436,-72,-1080
248,-68,-1112
276,-92,-1052
252,-84,-1116
136,160,-1044
364,-248,-984
372,92,-1232
164,76,-1172
44,-40,-1080
204,-256,-972
252,-356,-908
`;

export const invalidDataLabels = `still,0000000000111110000000000;shake,0000010101010100000000000;
x,y,zzzzz
action,still,
-40,624,-856
-52,672,-856
-72,580,-836
`;

export const missingActionName = `still,0000000000111110000000000;shake,0000010101010100000000000;
x,y,z
action,still,
-40,624,-856
-52,672,-856
-72,580,-836
-12,664,-860
-28,596,-848
-52,644,-860
-20,688,-836
-4,676,-860
-40,588,-832
-72,560,-828
-60,572,-844
-20,672,-868
-52,572,-828
-20,652,-848
-64,600,-844
-60,592,-852
-48,592,-852
-52,592,-844
-36,632,-844
-52,612,-836
-40,624,-836
-44,616,-840
-40,624,-844
-32,628,-832
-28,612,-852
-28,624,-848
-32,620,-840
-40,624,-860
-52,628,-840
-40,612,-840
-44,616,-848
-36,620,-844
-40,628,-868
-40,612,-832
-36,620,-856
-40,616,-848
-32,620,-848
-32,620,-852
-36,624,-848
-36,616,-836
-36,624,-864
-44,624,-856
-32,624,-852
-40,628,-828
-36,624,-840
-28,620,-836
-36,620,-844
-40,628,-840
-40,620,-840
-44,632,-848
-32,620,-860
-32,624,-860
-40,628,-840
-40,624,-832
-28,612,-844
-32,616,-840
-36,632,-828
-36,616,-840
-36,620,-864
-40,624,-844
-40,624,-848
-48,620,-836
-32,620,-852
-36,620,-860
-40,624,-840
-40,616,-852
-36,612,-844
-40,628,-856
-36,620,-852
-36,612,-828
-24,616,-868
-36,604,-856
-40,616,-860
-40,612,-852
-32,620,-864
-32,616,-856
-28,612,-844
-36,608,-856
-32,616,-856
-28,604,-860
action,,
-52,600,-856
-48,556,-868
-24,716,-872
-64,548,-840
-84,448,-828
-32,588,-864
-24,692,-880
-24,728,-892
-76,540,-860
-24,656,-868
-48,612,-868
-76,552,-856
-56,608,-856
-48,604,-860
-68,572,-868
-44,592,-852
-52,612,-872
-48,620,-896
-56,580,-860
-52,632,-876
-44,624,-860
-52,600,-868
-44,604,-860
-48,604,-856
-60,600,-872
-52,600,-860
-52,596,-860
-52,592,-864
-40,600,-852
-52,616,-872
-48,600,-860
-48,612,-868
-52,608,-860
-40,608,-856
-44,604,-868
-52,600,-856
-44,596,-848
-52,600,-864
-48,604,-860
-44,608,-848
-48,596,-860
-44,604,-884
-44,604,-860
-48,604,-864
-40,604,-868
-44,604,-864
-48,608,-868
-48,600,-844
-44,604,-868
-40,604,-852
-48,608,-856
-48,592,-860
-44,596,-856
-44,604,-848
-48,608,-856
-44,608,-860
-48,600,-852
-48,604,-848
-52,608,-856
-48,604,-844
-52,600,-856
-40,604,-856
-44,608,-860
-40,604,-872
-48,608,-856
-48,600,-852
-44,596,-848
-52,608,-872
-44,604,-856
-52,612,-856
-52,608,-864
-44,608,-872
-48,596,-872
-44,604,-844
-48,604,-852
-48,600,-864
-52,604,-860
-44,600,-872
-44,600,-864
-40,600,-868
`;

export const unexpectedRow = `still,0000000000111110000000000;shake,0000010101010100000000000;
x,y,z
action,still,
-40,624,-856
-52,672,-856
-72,580,-836
-12,664,-860
-28,596,-848
-52,644,-860
-20,688,-836
-4,676,-860
-40,588,-832
-72,560,-828
-60,572,-844
-20,672,-868
-52,572,-828
-20,652,-848
-64,600,-844
-60,592,-852
-48,592,-852
-52,592,-844
-36,632,-844
-52,612,-836
-40,624,-836
-44,616,-840
-40,624,-844
-32,628,-832
-28,612,-852
-28,624,-848
-32,620,-840
-40,624,-860
-52,628,-840
-40,612,-840
X,Y,Z
-36,620,-844
-40,628,-868
-40,612,-832
-36,620,-856
-40,616,-848
-32,620,-848
-32,620,-852
-36,624,-848
-36,616,-836
-36,624,-864
-44,624,-856
-32,624,-852
-40,628,-828
-36,624,-840
-28,620,-836
-36,620,-844
-40,628,-840
-40,620,-840
-44,632,-848
-32,620,-860
-32,624,-860
-40,628,-840
-40,624,-832
-28,612,-844
-32,616,-840
-36,632,-828
-36,616,-840
-36,620,-864
-40,624,-844
-40,624,-848
-48,620,-836
-32,620,-852
-36,620,-860
-40,624,-840
-40,616,-852
-36,612,-844
-40,628,-856
-36,620,-852
-36,612,-828
-24,616,-868
-36,604,-856
-40,616,-860
-40,612,-852
-32,620,-864
-32,616,-856
-28,612,-844
-36,608,-856
-32,616,-856
-28,604,-860
`;

export const insufficientDataForShakeRecording = `still,0000000000111110000000000;shake,0000010101010100000000000;
x,y,z
action,still,
-40,624,-856
-52,672,-856
-72,580,-836
-12,664,-860
-28,596,-848
-52,644,-860
-20,688,-836
-4,676,-860
-40,588,-832
-72,560,-828
-60,572,-844
-20,672,-868
-52,572,-828
-20,652,-848
-64,600,-844
-60,592,-852
-48,592,-852
-52,592,-844
-36,632,-844
-52,612,-836
-40,624,-836
-44,616,-840
-40,624,-844
-32,628,-832
-28,612,-852
-28,624,-848
-32,620,-840
-40,624,-860
-52,628,-840
-40,612,-840
-44,616,-848
-36,620,-844
-40,628,-868
-40,612,-832
-36,620,-856
-40,616,-848
-32,620,-848
-32,620,-852
-36,624,-848
-36,616,-836
-36,624,-864
-44,624,-856
-32,624,-852
-40,628,-828
-36,624,-840
-28,620,-836
-36,620,-844
-40,628,-840
-40,620,-840
-44,632,-848
-32,620,-860
-32,624,-860
-40,628,-840
-40,624,-832
-28,612,-844
-32,616,-840
-36,632,-828
-36,616,-840
-36,620,-864
-40,624,-844
-40,624,-848
-48,620,-836
-32,620,-852
-36,620,-860
-40,624,-840
-40,616,-852
-36,612,-844
-40,628,-856
-36,620,-852
-36,612,-828
-24,616,-868
-36,604,-856
-40,616,-860
-40,612,-852
-32,620,-864
-32,616,-856
-28,612,-844
-36,608,-856
-32,616,-856
-28,604,-860
action,shake,
-52,600,-856
-48,556,-868
-24,716,-872
-64,548,-840
-84,448,-828
-32,588,-864
-24,692,-880
-24,728,-892
-76,540,-860
-24,656,-868
-48,612,-868
-76,552,-856
-56,608,-856
-48,604,-860
-68,572,-868
-44,592,-852
-52,612,-872
-48,620,-896
-56,580,-860
-52,632,-876
-44,624,-860
-52,600,-868
-44,604,-860
-48,604,-856
-60,600,-872
-52,600,-860
-52,596,-860
-52,592,-864
-40,600,-852
-52,616,-872
-48,600,-860
-48,612,-868
-52,608,-860
-40,608,-856
-44,604,-868
-52,600,-856
-44,596,-848
-52,600,-864
-48,604,-860
-44,608,-848
-48,596,-860
-44,604,-884
-44,604,-860
-48,604,-864
-40,604,-868
-44,604,-864
-48,608,-868
-48,600,-844
-44,604,-868
-40,604,-852
-48,608,-856
-48,592,-860
-44,596,-856
-44,604,-848
-48,608,-856
-44,608,-860
-48,600,-852
-48,604,-848
-52,608,-856
-48,604,-844
-52,600,-856
-40,604,-856
-44,608,-860
-40,604,-872
-48,608,-856
-48,600,-852
-44,596,-848
-52,608,-872
-44,604,-856
action,still,
200,-12,-1032
260,-36,-1016
208,-60,-1012
236,-68,-928
244,-124,-944
280,-52,-1048
176,-196,-1068
188,-176,-1000
344,-188,-888
184,-152,-1128
152,-84,-1156
92,-76,-1008
4,-108,-980
80,-12,-972
44,-172,-872
-8,-84,-1072
-88,-68,-1020
-68,-36,-832
728,-248,-1144
172,-300,-908
132,-268,-1024
240,-416,-1200
28,-264,-1048
68,-316,-1064
60,-304,-984
96,-348,-924
120,-396,-884
136,-428,-1156
32,-384,-948
-100,-272,-972
-44,-220,-964
-140,-232,-1032
-236,-176,-920
-388,-300,-1160
-224,-148,-1136
-100,-264,-1112
-132,-176,-956
-188,-72,-908
-368,-92,-1212
-400,-92,-1136
-344,-32,-1060
-128,-188,-1352
-48,-160,-852
-136,104,-816
-176,68,-324
220,-296,-868
-416,348,-936
356,-208,-1136
252,-328,-968
136,84,-844
288,-4,-1172
240,-96,-1132
172,-324,-808
356,-600,-688
252,-256,-992
108,68,-1036
292,-192,-992
312,-212,-928
308,-244,-1020
296,-112,-928
212,8,-960
408,-192,-1072
364,-136,-1100
312,-76,-1104
272,48,-1064
268,-100,-920
168,-88,-1128
252,16,-1084
364,-164,-1048
436,-72,-1080
248,-68,-1112
276,-92,-1052
252,-84,-1116
136,160,-1044
364,-248,-984
372,92,-1232
164,76,-1172
44,-40,-1080
204,-256,-972
252,-356,-908
`;

export const incompleteRowInShakeRecording = `still,0000000000111110000000000;shake,0000010101010100000000000;
x,y,z
action,still,
-40,624,-856
-52,672,-856
-72,580,-836
-12,664,-860
-28,596,-848
-52,644,-860
-20,688,-836
-4,676,-860
-40,588,-832
-72,560,-828
-60,572,-844
-20,672,-868
-52,572,-828
-20,652,-848
-64,600,-844
-60,592,-852
-48,592,-852
-52,592,-844
-36,632,-844
-52,612,-836
-40,624,-836
-44,616,-840
-40,624,-844
-32,628,-832
-28,612,-852
-28,624,-848
-32,620,-840
-40,624,-860
-52,628,-840
-40,612,-840
-44,616,-848
-36,620,-844
-40,628,-868
-40,612,-832
-36,620,-856
-40,616,-848
-32,620,-848
-32,620,-852
-36,624,-848
-36,616,-836
-36,624,-864
-44,624,-856
-32,624,-852
-40,628,-828
-36,624,-840
-28,620,-836
-36,620,-844
-40,628,-840
-40,620,-840
-44,632,-848
-32,620,-860
-32,624,-860
-40,628,-840
-40,624,-832
-28,612,-844
-32,616,-840
-36,632,-828
-36,616,-840
-36,620,-864
-40,624,-844
-40,624,-848
-48,620,-836
-32,620,-852
-36,620,-860
-40,624,-840
-40,616,-852
-36,612,-844
-40,628,-856
-36,620,-852
-36,612,-828
-24,616,-868
-36,604,-856
-40,616,-860
-40,612,-852
-32,620,-864
-32,616,-856
-28,612,-844
-36,608,-856
-32,616,-856
-28,604,-860
action,shake,
-52,600,-856
-48,556,-868
-24,716,-872
-64,548,-840
-84,448,-828
-32,588,-864
-24,692,-880
-24,728,-892
-76,540,-860
-24,656,-868
-48,612,-868
-76,552,-856
-56,608,-856
-48,604,-860
-68,572,-868
-44,592,-852
-52,612,-872
-48,620,-896
-56,580,-860
-52,632,-876
-44,624,-860
-52,600,-868
-44,604,-860
-48,604,-856
-60,600,-872
-52,600,-860
-52,596,-860
-52,592,-864
-40,600,-852
-52,616,-872
-48,600,-860
-48,612,
-52,608,-860
-40,608,-856
-44,604,-868
-52,600,-856
-44,596,-848
-52,600,-864
-48,604,-860
-44,608,-848
-48,596,-860
-44,604,-884
-44,604,-860
-48,604,-864
-40,604,-868
-44,604,-864
-48,608,-868
-48,600,-844
-44,604,-868
-40,604,-852
-48,608,-856
-48,592,-860
-44,596,-856
-44,604,-848
-48,608,-856
-44,608,-860
-48,600,-852
-48,604,-848
-52,608,-856
-48,604,-844
-52,600,-856
-40,604,-856
-44,608,-860
-40,604,-872
-48,608,-856
-48,600,-852
-44,596,-848
-52,608,-872
-44,604,-856
-52,612,-856
-52,608,-864
-44,608,-872
-48,596,-872
-44,604,-844
-48,604,-852
-48,600,-864
-52,604,-860
-44,600,-872
-44,600,-864
-40,600,-868
action,still,
200,-12,-1032
260,-36,-1016
208,-60,-1012
236,-68,-928
244,-124,-944
280,-52,-1048
176,-196,-1068
188,-176,-1000
344,-188,-888
184,-152,-1128
152,-84,-1156
92,-76,-1008
4,-108,-980
80,-12,-972
44,-172,-872
-8,-84,-1072
-88,-68,-1020
-68,-36,-832
728,-248,-1144
172,-300,-908
132,-268,-1024
240,-416,-1200
28,-264,-1048
68,-316,-1064
60,-304,-984
96,-348,-924
120,-396,-884
136,-428,-1156
32,-384,-948
-100,-272,-972
-44,-220,-964
-140,-232,-1032
-236,-176,-920
-388,-300,-1160
-224,-148,-1136
-100,-264,-1112
-132,-176,-956
-188,-72,-908
-368,-92,-1212
-400,-92,-1136
-344,-32,-1060
-128,-188,-1352
-48,-160,-852
-136,104,-816
-176,68,-324
220,-296,-868
-416,348,-936
356,-208,-1136
252,-328,-968
136,84,-844
288,-4,-1172
240,-96,-1132
172,-324,-808
356,-600,-688
252,-256,-992
108,68,-1036
292,-192,-992
312,-212,-928
308,-244,-1020
296,-112,-928
212,8,-960
408,-192,-1072
364,-136,-1100
312,-76,-1104
272,48,-1064
268,-100,-920
168,-88,-1128
252,16,-1084
364,-164,-1048
436,-72,-1080
248,-68,-1112
276,-92,-1052
252,-84,-1116
136,160,-1044
364,-248,-984
372,92,-1232
164,76,-1172
44,-40,-1080
204,-256,-972
252,-356,-908
`;

export const stillDataRecordingOne = {
  x: [
    -0.04, -0.052, -0.072, -0.012, -0.028, -0.052, -0.02, -0.004, -0.04, -0.072, -0.06,
    -0.02, -0.052, -0.02, -0.064, -0.06, -0.048, -0.052, -0.036, -0.052, -0.04, -0.044,
    -0.04, -0.032, -0.028, -0.028, -0.032, -0.04, -0.052, -0.04, -0.044, -0.036, -0.04,
    -0.04, -0.036, -0.04, -0.032, -0.032, -0.036, -0.036, -0.036, -0.044, -0.032, -0.04,
    -0.036, -0.028, -0.036, -0.04, -0.04, -0.044, -0.032, -0.032, -0.04, -0.04, -0.028,
    -0.032, -0.036, -0.036, -0.036, -0.04, -0.04, -0.048, -0.032, -0.036, -0.04, -0.04,
    -0.036, -0.04, -0.036, -0.036, -0.024, -0.036, -0.04, -0.04, -0.032, -0.032, -0.028,
    -0.036, -0.032, -0.028,
  ],
  y: [
    0.624, 0.672, 0.58, 0.664, 0.596, 0.644, 0.688, 0.676, 0.588, 0.56, 0.572, 0.672,
    0.572, 0.652, 0.6, 0.592, 0.592, 0.592, 0.632, 0.612, 0.624, 0.616, 0.624, 0.628,
    0.612, 0.624, 0.62, 0.624, 0.628, 0.612, 0.616, 0.62, 0.628, 0.612, 0.62, 0.616, 0.62,
    0.62, 0.624, 0.616, 0.624, 0.624, 0.624, 0.628, 0.624, 0.62, 0.62, 0.628, 0.62, 0.632,
    0.62, 0.624, 0.628, 0.624, 0.612, 0.616, 0.632, 0.616, 0.62, 0.624, 0.624, 0.62, 0.62,
    0.62, 0.624, 0.616, 0.612, 0.628, 0.62, 0.612, 0.616, 0.604, 0.616, 0.612, 0.62,
    0.616, 0.612, 0.608, 0.616, 0.604,
  ],
  z: [
    -0.856, -0.856, -0.836, -0.86, -0.848, -0.86, -0.836, -0.86, -0.832, -0.828, -0.844,
    -0.868, -0.828, -0.848, -0.844, -0.852, -0.852, -0.844, -0.844, -0.836, -0.836, -0.84,
    -0.844, -0.832, -0.852, -0.848, -0.84, -0.86, -0.84, -0.84, -0.848, -0.844, -0.868,
    -0.832, -0.856, -0.848, -0.848, -0.852, -0.848, -0.836, -0.864, -0.856, -0.852,
    -0.828, -0.84, -0.836, -0.844, -0.84, -0.84, -0.848, -0.86, -0.86, -0.84, -0.832,
    -0.844, -0.84, -0.828, -0.84, -0.864, -0.844, -0.848, -0.836, -0.852, -0.86, -0.84,
    -0.852, -0.844, -0.856, -0.852, -0.828, -0.868, -0.856, -0.86, -0.852, -0.864, -0.856,
    -0.844, -0.856, -0.856, -0.86,
  ],
};

export const stillDataRecordingTwo = {
  x: [
    0.2, 0.26, 0.208, 0.236, 0.244, 0.28, 0.176, 0.188, 0.344, 0.184, 0.152, 0.092, 0.004,
    0.08, 0.044, -0.008, -0.088, -0.068, 0.728, 0.172, 0.132, 0.24, 0.028, 0.068, 0.06,
    0.096, 0.12, 0.136, 0.032, -0.1, -0.044, -0.14, -0.236, -0.388, -0.224, -0.1, -0.132,
    -0.188, -0.368, -0.4, -0.344, -0.128, -0.048, -0.136, -0.176, 0.22, -0.416, 0.356,
    0.252, 0.136, 0.288, 0.24, 0.172, 0.356, 0.252, 0.108, 0.292, 0.312, 0.308, 0.296,
    0.212, 0.408, 0.364, 0.312, 0.272, 0.268, 0.168, 0.252, 0.364, 0.436, 0.248, 0.276,
    0.252, 0.136, 0.364, 0.372, 0.164, 0.044, 0.204, 0.252,
  ],
  y: [
    -0.012, -0.036, -0.06, -0.068, -0.124, -0.052, -0.196, -0.176, -0.188, -0.152, -0.084,
    -0.076, -0.108, -0.012, -0.172, -0.084, -0.068, -0.036, -0.248, -0.3, -0.268, -0.416,
    -0.264, -0.316, -0.304, -0.348, -0.396, -0.428, -0.384, -0.272, -0.22, -0.232, -0.176,
    -0.3, -0.148, -0.264, -0.176, -0.072, -0.092, -0.092, -0.032, -0.188, -0.16, 0.104,
    0.068, -0.296, 0.348, -0.208, -0.328, 0.084, -0.004, -0.096, -0.324, -0.6, -0.256,
    0.068, -0.192, -0.212, -0.244, -0.112, 0.008, -0.192, -0.136, -0.076, 0.048, -0.1,
    -0.088, 0.016, -0.164, -0.072, -0.068, -0.092, -0.084, 0.16, -0.248, 0.092, 0.076,
    -0.04, -0.256, -0.356,
  ],
  z: [
    -1.032, -1.016, -1.012, -0.928, -0.944, -1.048, -1.068, -1, -0.888, -1.128, -1.156,
    -1.008, -0.98, -0.972, -0.872, -1.072, -1.02, -0.832, -1.144, -0.908, -1.024, -1.2,
    -1.048, -1.064, -0.984, -0.924, -0.884, -1.156, -0.948, -0.972, -0.964, -1.032, -0.92,
    -1.16, -1.136, -1.112, -0.956, -0.908, -1.212, -1.136, -1.06, -1.352, -0.852, -0.816,
    -0.324, -0.868, -0.936, -1.136, -0.968, -0.844, -1.172, -1.132, -0.808, -0.688,
    -0.992, -1.036, -0.992, -0.928, -1.02, -0.928, -0.96, -1.072, -1.1, -1.104, -1.064,
    -0.92, -1.128, -1.084, -1.048, -1.08, -1.112, -1.052, -1.116, -1.044, -0.984, -1.232,
    -1.172, -1.08, -0.972, -0.908,
  ],
};

export const shakeDataRecordingOne = {
  x: [
    -0.052, -0.048, -0.024, -0.064, -0.084, -0.032, -0.024, -0.024, -0.076, -0.024,
    -0.048, -0.076, -0.056, -0.048, -0.068, -0.044, -0.052, -0.048, -0.056, -0.052,
    -0.044, -0.052, -0.044, -0.048, -0.06, -0.052, -0.052, -0.052, -0.04, -0.052, -0.048,
    -0.048, -0.052, -0.04, -0.044, -0.052, -0.044, -0.052, -0.048, -0.044, -0.048, -0.044,
    -0.044, -0.048, -0.04, -0.044, -0.048, -0.048, -0.044, -0.04, -0.048, -0.048, -0.044,
    -0.044, -0.048, -0.044, -0.048, -0.048, -0.052, -0.048, -0.052, -0.04, -0.044, -0.04,
    -0.048, -0.048, -0.044, -0.052, -0.044, -0.052, -0.052, -0.044, -0.048, -0.044,
    -0.048, -0.048, -0.052, -0.044, -0.044, -0.04,
  ],
  y: [
    0.6, 0.556, 0.716, 0.548, 0.448, 0.588, 0.692, 0.728, 0.54, 0.656, 0.612, 0.552,
    0.608, 0.604, 0.572, 0.592, 0.612, 0.62, 0.58, 0.632, 0.624, 0.6, 0.604, 0.604, 0.6,
    0.6, 0.596, 0.592, 0.6, 0.616, 0.6, 0.612, 0.608, 0.608, 0.604, 0.6, 0.596, 0.6,
    0.604, 0.608, 0.596, 0.604, 0.604, 0.604, 0.604, 0.604, 0.608, 0.6, 0.604, 0.604,
    0.608, 0.592, 0.596, 0.604, 0.608, 0.608, 0.6, 0.604, 0.608, 0.604, 0.6, 0.604, 0.608,
    0.604, 0.608, 0.6, 0.596, 0.608, 0.604, 0.612, 0.608, 0.608, 0.596, 0.604, 0.604, 0.6,
    0.604, 0.6, 0.6, 0.6,
  ],
  z: [
    -0.856, -0.868, -0.872, -0.84, -0.828, -0.864, -0.88, -0.892, -0.86, -0.868, -0.868,
    -0.856, -0.856, -0.86, -0.868, -0.852, -0.872, -0.896, -0.86, -0.876, -0.86, -0.868,
    -0.86, -0.856, -0.872, -0.86, -0.86, -0.864, -0.852, -0.872, -0.86, -0.868, -0.86,
    -0.856, -0.868, -0.856, -0.848, -0.864, -0.86, -0.848, -0.86, -0.884, -0.86, -0.864,
    -0.868, -0.864, -0.868, -0.844, -0.868, -0.852, -0.856, -0.86, -0.856, -0.848, -0.856,
    -0.86, -0.852, -0.848, -0.856, -0.844, -0.856, -0.856, -0.86, -0.872, -0.856, -0.852,
    -0.848, -0.872, -0.856, -0.856, -0.864, -0.872, -0.872, -0.844, -0.852, -0.864, -0.86,
    -0.872, -0.864, -0.868,
  ],
};