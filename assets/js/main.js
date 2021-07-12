'use strict';

/**
 * 
 */
class Tracks {

    constructor( containerId, options ) {
        this.containerId  = containerId;
        this.container    = document.getElementById( containerId );
        this.canvas       = document.createElement( 'canvas' );
        this.context      = this.canvas.getContext( '2d' );
        this.preCanvas    = document.createElement( 'canvas' );
        this.preContext   = this.preCanvas.getContext( '2d' );
        this.lines        = [];
        this.options      = Object.assign({
            fps:              30,
            autoSize:         true,
            lineWeight:       20,
            lineGap:          5,
            backgroundColor:  '#fff',
            minSegmentLength: 0,
            maxSegmentLength: 100,
            minSegmentGap:    10,
            maxSegmentGap:    600,
        }, options );

        this.container.appendChild( this.canvas );
        this.renderSpeedLog = [];

        this.update();
        this.animate();
    
        window.addEventListener( 'resize',  this.update.bind( this ) );
    }

    render() {
        let ctx = this.context;

        ctx.fillStyle = this.options.backgroundColor;
        ctx.fillRect( 0, 0, this.width(), this.height() );

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        this.lines.forEach( line => {
            line.segments.forEach( segment => { 
                let point1 = segment.point1;
                let point2 = segment.point2;
                let width  = point2.x - point1.x;
                let height = this.options.lineWeight;

                [ point1, point2 ].forEach( point => {
                    ctx.beginPath();
                    ctx.arc(  point.x, point.y , this.options.lineWeight / 2, 0, 2 * Math.PI, false );
                    ctx.fill();
                });

                ctx.fillRect( point1.x, point1.y - height / 2, width, height );
            });
        });
        
        ctx.restore();

        this.context.drawImage( this.preCanvas, 0, 0 );
    }

    animate() {
        if( true === this.paused ) {
            return;
        }

        this.render();

        setTimeout( () => {
            requestAnimationFrame( this.animate.bind( this ) );
        }, 1000 / this.options.fps );
    }

    update() {
        if( this.options.autoSize || true ) {
            this.canvas.width  = this.preCanvas.width  = this.container.offsetWidth;
            this.canvas.height = this.preCanvas.height = this.container.offsetHeight;
        }
    }

    generateLines() {
        let 
            totalLines       = Math.floor( this.height() / ( this.options.lineWeight + this.options.lineGap ) ),
            totalLinesHeight = ( this.options.lineWeight + this.options.lineGap ) * totalLines - this.options.lineGap,
            offset           = totalLinesHeight / totalLines - ( this.options.lineWeight + this.options.lineGap ) / 2;

        while( this.lines.length < totalLines ) {
            let 
                y    = ( this.options.lineWeight + this.options.lineGap ) * this.lines.length + offset,
                line = new Line( this.context, 0, y, this.width(), y, {} );

            line.segments = this.generateSegments( line );

            this.lines.push( line );
        }
    }

    generateSegments( line ) {
        let
            counter  = Math.random() * 1 > .5 ? 0 : 1,
            x        = line.x1 + this.options.lineWeight,
            segments = [],
            filled   = false;

        while( ! filled ) {
            let
                gap   = counter % 2,
                min   = gap ? this.options.minSegmentGap : this.options.minSegmentLength,
                max   = gap ? this.options.maxSegmentGap : this.options.maxSegmentLength,
                width = this.getRandomIntInclusive( min, max );

            if( gap ) {
                x += width;
                counter++;
                continue;
            }

            if( x + width >= line.x2 - this.options.lineWeight ) {
                if( ( line.x2 - this.options.lineWeight ) - x > this.options.minSegmentGap ) {
                    segments.push( new Line( 
                        this.context,
                        x,
                        line.y1,
                        line.x2 - this.options.lineWeight,
                        line.y2,
                        {}
                    ));
                }
                
                return segments;
            }

            segments.push( new Line( 
                this.context,
                x,
                line.y1,
                x + width,
                line.y2,
                {}
            ));

            x += width;
            counter++;
        }

        return segments;
    }

    getRandomIntInclusive( min, max ) {
        min = Math.ceil(min);
        max = Math.floor(max);

        return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
    }
  
    pause() {
        this.paused = true;  
    }
    
    play() {
        this.paused = false;
        
        this.animate();
    }

    width() {
        return this.canvas.offsetWidth;
    }

    height() {
        return this.canvas.offsetHeight;
    }
}


/**
 * 
 */
class Line {

    constructor( context, x1, y1, x2, y2, options ) {
        this.context  = context;
        this.segments = [];
        this.options  = Object.assign( {}, options );

        this._x1     = x1;
        this._y1     = y1;
        this._x2     = x2;
        this._y2     = y2;
        this._point1 = { x: x1, y: y1 };
        this._point2 = { x: x2, y: y2 };
        this._slope  = ( y2 - y1 ) / ( x2 - x1 );
        this._length = this.distanceBetween( this._point1, this._point2 );
    }

    render() {
        if( ! this.segments.length ) return;

        this.segments.forEach( segment => {
            segment.render();
        });
    }

    plotPoint( distance ) {
        let coef = distance / this._length;
        
        return { 

            x: this._x1 + ( this._x2 - this._x1 ) * coef, 
            y: this._y1 + ( this._y2 - this._y1 ) * coef

        };
    }

    angleBetween( point1, point2 ) {
        return Math.atan2( point2.y - point1.y, point2.x - point1.x );
    }

    distanceBetween( point1, point2 ) {
        let a = point1.x - point2.x;
        let b = point1.y - point2.y;

        return Math.sqrt( a * a + b * b );
    }

    get point1() {
        return this._point1;
    }

    get point2() {
        return this._point2;
    }

    get length() {
        return this._length;
    }

    get slope() {
        return this._slope;
    }

    get x1() {
        return this._x1;
    }

    get y1() {
        return this._y1;
    }

    get x2() {
        return this._x2;
    }

    get y2() {
        return this._y2;
    }

    set x1( number ) {
        this._x1 = number;

        this._point1 = { x: this._x1, y: this._y1 };
        this._slope  = ( this._y2 - this._y1 ) / ( this._x2 - this._x1 );
        this._length = this.distanceBetween( this._point1, this._point2 );
    }

    set y1( number ) {
        this._y1 = number;

        this._point1 = { x: this._x1, y: this._y1 };
        this._slope  = ( this._y2 - this._y1 ) / ( this._x2 - this._x1 );
        this._length = this.distanceBetween( this._point1, this._point2 );
    }

    set x2( number ) {
        this._x2 = number;

        this._point2 = { x: this._x2, y: this._y2 };
        this._slope  = ( this._y2 - this._y1 ) / ( this._x2 - this._x1 );
        this._length = this.distanceBetween( this._point1, this._point2 );
    }

    set y2( number ) {
        this._y2 = number;

        this._point2 = { x: this._x2, y: this._y2 };
        this._slope  = ( this._y2 - this._y1 ) / ( this._x2 - this._x1 );
        this._length = this.distanceBetween( this._point1, this._point2 );		
    }
}


/**
 * 
 */
class Segment extends Line {

    constructor( context, x1, y1, x2, y2, options ) {
        super( context, x1, y1, x2, y2, options );

        this.context = context;
        this.options = Object.assign( {}, options );
    }
}


/**
 * 
 */
 class TrackOptions {
    constructor() {
        this.lineWeight       = 10;
        this.lineGap          = 10;
        this.minSegmentLength = 50;
        this.maxSegmentLength = 400;
        this.minSegmentGap    = 10;
        this.maxSegmentGap    = 100;
    }
}


/**
 * 
 */

 (() => {

    let 
        tracks,
        trackOptions,
        gui,
        controllers;

    document.addEventListener( 'DOMContentLoaded', event => {
        tracks = new Tracks( 'container', {
            fps:              1,
            lineWeight:       10,
            lineGap:          10,
            minSegmentLength: 0,
            maxSegmentLength: 400,
            minSegmentGap:    10,
            maxSegmentGap:    100,
        });

        tracks.update();
        tracks.generateLines();
        tracks.render();
    });

    window.addEventListener( 'load', event => {
        trackOptions = new TrackOptions();
        controllers  = [];
        gui          = new dat.GUI();

        gui.useLocalStorage = true;
        gui.remember( trackOptions );

        controllers.push( gui.add( trackOptions, 'lineWeight',       1, 100  ) );
        controllers.push( gui.add( trackOptions, 'lineGap',          1, 100  ) );
        controllers.push( gui.add( trackOptions, 'minSegmentLength', 0, 1000 ) );
        controllers.push( gui.add( trackOptions, 'maxSegmentLength', 0, 1000 ) );
        controllers.push( gui.add( trackOptions, 'minSegmentGap',    1, 1000 ) );
        controllers.push( gui.add( trackOptions, 'maxSegmentGap',    1, 1000 ) );

        controllers.forEach( controller => {
            
            controller.onChange( value => {

                update();

            })

        });

        update();
    });

    function update() {
        tracks.options.lineWeight       = trackOptions.lineWeight;
        tracks.options.lineGap          = trackOptions.lineGap;
        tracks.options.minSegmentLength = trackOptions.minSegmentLength;
        tracks.options.maxSegmentLength = trackOptions.maxSegmentLength;
        tracks.options.minSegmentGap    = trackOptions.minSegmentGap;
        tracks.options.maxSegmentGap    = trackOptions.maxSegmentGap;

        tracks.lines = [];

        tracks.update();
        tracks.generateLines();
        tracks.render();
    }
})();

/**
 * 
 */
 CSS.registerProperty({
    name: '--ang', 
    syntax: '<angle>', 
    initialValue: '0deg', 
    inherits: true
});

CSS.registerProperty({
    name: '--grad1', 
    syntax: '<color>', 
    initialValue: '#2dadaf', 
    inherits: false
});

CSS.registerProperty({
    name: '--grad2', 
    syntax: '<color>', 
    initialValue: '#17a353', 
    inherits: false
});
