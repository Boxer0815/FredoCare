import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

interface Balken {
  label: string;
  wert: number;
  farbe?: string;
}

interface Props {
  daten: Balken[];
  hoehe?: number;
  farbe?: string;
  dunkel: boolean;
  einheit?: string;
}

export default function BalkenChart({ daten, hoehe = 160, farbe = '#5B8DEF', dunkel, einheit = '' }: Props) {
  const breite = 320;
  const padLinks = 28;
  const padRechts = 8;
  const padOben = 16;
  const padUnten = 28;
  const plotBreite = breite - padLinks - padRechts;
  const plotHoehe = hoehe - padOben - padUnten;

  const maxWert = Math.max(...daten.map((d) => d.wert), 1);
  const balkBreite = Math.max(6, (plotBreite / daten.length) * 0.55);
  const abstand = plotBreite / daten.length;

  const achsenFarbe = dunkel ? '#555' : '#DDD';
  const textFarbe = dunkel ? '#AAA' : '#8E8E93';

  const yTicks = 4;

  return (
    <View>
      <Svg width={breite} height={hoehe}>
        {/* Y-Achsen-Linien */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padOben + (plotHoehe / yTicks) * i;
          return (
            <Line
              key={i}
              x1={padLinks}
              y1={y}
              x2={breite - padRechts}
              y2={y}
              stroke={achsenFarbe}
              strokeWidth={0.5}
            />
          );
        })}
        {/* Y-Labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padOben + (plotHoehe / yTicks) * i;
          const val = Math.round(maxWert - (maxWert / yTicks) * i);
          return (
            <SvgText
              key={`yl-${i}`}
              x={padLinks - 4}
              y={y + 4}
              fontSize={9}
              fill={textFarbe}
              textAnchor="end"
            >
              {val}
            </SvgText>
          );
        })}
        {/* Balken + X-Labels */}
        {daten.map((d, i) => {
          const balkHoehe = (d.wert / maxWert) * plotHoehe;
          const x = padLinks + i * abstand + abstand / 2 - balkBreite / 2;
          const y = padOben + plotHoehe - balkHoehe;
          return (
            <View key={i}>
              <Rect
                x={x}
                y={y}
                width={balkBreite}
                height={balkHoehe}
                rx={3}
                fill={d.farbe ?? farbe}
                opacity={0.9}
              />
              <SvgText
                x={padLinks + i * abstand + abstand / 2}
                y={hoehe - 6}
                fontSize={9}
                fill={textFarbe}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </View>
          );
        })}
      </Svg>
    </View>
  );
}
