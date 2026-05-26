import pandas as pd
import io

csv_data = """P1,P2,CP1,CP2,FRP1,FRP2,SA,Substrate,CG,FRA,FRH,GTE,GTI,HR,Pressure,COM,PC,TOCVD,Class,PL Peak Position,PL FWHM
WO3,Sulfur,35,2000,,,graphite,Ar,,100,0,1000,20,15,730,Rapid,Quartz boat,Thermal CVD,Monolayer,1.99,21
WCl6,Sulfur,200,800,,,SiO2/Si,Ar,,2.5,0,800,15,15,,Natural,Al2O3 crucible,Thermal CVD,Nanosheet,2.014,124
W(CO)6,H2S,,,0.00017,7,,Sapphire (0001),CH4,0,200,800,30,,50,Bubbler,Thermal CVD,,,1.99,60
W(CO)6,DTBS,,,0.00735,7.28,,SiO2/Si,H2/Ar,500,25,850,,20,50,Bubbler,Thermal CVD,,,2.01,69
W(CO)6,Sulfur,,,,,,Graphene,He,,0,0,600,,,,Sulfur boat,Thermal CVD,,,1.99,27
WF6,H2S,,,0.025,0.33,NaCl,SiO2/Si,Ar,100,0,640,40,,7.5,Ceramic boat,Thermal CVD,,,1.97,48
WF6,H2S,,,,,SnCl4,SiO2/Si,Ar,,0,550,,,30,Gas cylinder,Thermal CVD,,,2.01,60
WO3,Sulfur,45,1800,,,graphite,Ar,,90,0,920,22,14,700,Rapid,Quartz boat,Thermal CVD,Monolayer,1.99,28
W(CO)6,H2S,,,0.0002,6.5,,Sapphire (0001),CH4,0,180,760,28,,45,Bubbler,Thermal CVD,,,1.98,54
WF6,H2S,,,0.018,0.28,NaCl,SiO2/Si,Ar,110,0,670,35,,10,Ceramic boat,Thermal CVD,,,1.97,43
WO3,Sulfur,30,1900,,,graphite,Ar,,95,0,980,18,16,720,Rapid,Quartz boat,Thermal CVD,Monolayer,1.99,24
W(CO)6,DTBS,,,0.006,6.8,,SiO2/Si,H2/Ar,450,20,830,,18,40,Bubbler,Thermal CVD,,,2,57
WF6,H2S,,,0.022,0.35,SnCl4,SiO2/Si,Ar,120,0,650,42,,8,Gas cylinder,Thermal CVD,,,1.96,41
W(CO)6,Sulfur,,,,,,Graphene,He,,0,0,620,,,,Sulfur boat,Thermal CVD,,,1.99,26
WO3,Sulfur,50,2100,,,graphite,Ar,,105,0,1010,21,15,735,Rapid,Quartz boat,Thermal CVD,Monolayer,1.99,22
WF6,H2S,,,0.02,0.3,NaCl,SiO2/Si,Ar,95,0,660,38,,9,Ceramic boat,Thermal CVD,,,1.97,45
W(CO)6,H2S,,,0.00015,7.1,,Sapphire (0001),CH4,0,210,790,32,,52,Bubbler,Thermal CVD,,,1.99,58"""

# Read original
df_original = pd.read_excel('C:/Users/Khushboo/OneDrive/Desktop/AI-Material-Optimization/labelled.xlsx')

# Read new data
df_new = pd.read_csv(io.StringIO(csv_data))

# Combine
df_combined = pd.concat([df_original, df_new], ignore_index=True)

# Save
df_combined.to_excel('C:/Users/Khushboo/OneDrive/Desktop/AI-Material-Optimization/labelled.xlsx', index=False)
print("Added new rows to dataset.")
